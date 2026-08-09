import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Jalur Hermes Agent SmartDash (fresh install, 7 Agu 2026)
const HERMES_EXE =
  "D:\\SmartDash\\engine\\hermes\\hermes-agent\\venv\\Scripts\\hermes.exe";
const HERMES_HOME = "D:\\SmartDash\\engine\\hermes";
const CHAT_TIMEOUT_MS = 120_000; // Hermes Agent butuh waktu mikir + tool call

type ChatBody = {
  messages?: Array<{ role?: string; content?: unknown }>;
  sessionId?: string | null;
};

// Bersihkan ANSI escape codes (warna/dim di terminal) sebelum parsing
function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, "").replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
}

// Jawaban AI = baris-baris stdout SETELAH baris "session_id:" terakhir
// (penanda konsisten di mode -Q --reasoning none). Fallback: ambil dari bawah,
// skip noise reasoning (box-drawing, duplikat prompt, kalimat reasoning).
function parseReply(stdout: string): string {
  const clean = stripAnsi(stdout);
  const lines = clean.split(/\r?\n/);

  // Fase 1: cari baris "session_id:" TERAKHIR → jawaban ada setelahnya
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^session_id:/.test(lines[i].trim())) start = i + 1;
  }

  // Fase 2: kumpulkan jawaban dari bawah ke atas, skip noise
  const answer: string[] = [];
  for (let i = lines.length - 1; i >= start; i--) {
    const t = lines[i].trim();
    if (answer.length > 0 || t.length > 0) {
      if (/^session_id:/.test(t)) break; // penanda (di atas jawaban)
      if (/^[┌─│╰└┬┴├┐┘]/.test(t)) break; // box-drawing reasoning
      if (/^\.?\s*The user\b/i.test(t)) continue; // duplikat prompt
      if (/Per my SOUL\.md|No tools needed|Simple (greeting|question)/i.test(t))
        continue; // baris reasoning yang wrap
      answer.unshift(lines[i]);
    }
  }
  const reply = answer.join("\n").trim();
  if (!reply) throw new Error("Hermes Agent tidak menghasilkan jawaban");
  return reply;
}

// Session id dikirim Hermes ke stderr (bersih, tidak tercampur jawaban)
function parseSessionId(stderr: string): string | null {
  const m = stderr.match(/session_id:\s*(\S+)/);
  return m ? m[1] : null;
}

export async function POST(req: Request) {
  try {
    const body: ChatBody = await req.json();
    const raw = body?.messages;

    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json(
        { ok: false, error: "messages wajib berupa array non-kosong" },
        { status: 400 }
      );
    }

    // Ambil pesan user TERAKHIR sebagai prompt (Hermes Agent pegang riwayat
    // lewat session resume — tidak perlu kirim seluruh history)
    const lastUser = [...raw]
      .reverse()
      .find(
        (m) =>
          m?.role === "user" &&
          typeof m?.content === "string" &&
          m.content.trim().length > 0
      );
    if (!lastUser) {
      return NextResponse.json(
        { ok: false, error: "tidak ada pesan user valid" },
        { status: 400 }
      );
    }
    const prompt = (lastUser.content as string).trim();
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.length > 0
        ? body.sessionId
        : null;

    // -Q quiet, --reasoning none → output lebih bersih + penanda session_id
    const args = ["chat", "-Q", "--reasoning", "none", "-q", prompt];
    if (sessionId) args.push("--resume", sessionId);

    const { stdout, stderr } = await execFileAsync(HERMES_EXE, args, {
      timeout: CHAT_TIMEOUT_MS,
      env: {
        ...process.env,
        // Anti-hijack: PYTHONPATH global MASTER jangan sampai nyuntik kode Abbu
        PYTHONPATH: "",
        HERMES_HOME,
        PYTHONIOENCODING: "utf-8",
      },
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    });

    const reply = parseReply(stdout);
    const nextSessionId = parseSessionId(stderr) ?? sessionId;

    return NextResponse.json({ ok: true, reply, sessionId: nextSessionId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan tak dikenal";
    // Hermes Agent mati / timeout / parsing gagal → balas error jelas
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
