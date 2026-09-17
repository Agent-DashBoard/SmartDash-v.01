import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

// Gateway LLM 127.0.0.1:20128 — model Smart-Dashboard
// (pakai 127.0.0.1, BUKAN localhost: gateway cuma listen IPv4;
//  fetch Node ke "localhost" coba IPv6 ::1 dulu → bisa hang/timeout)
const GATEWAY_URL = "http://127.0.0.1:20128/v1/chat/completions";
const MODEL = "Smart-Dashboard";
const TIMEOUT_MS = 45_000;
const MAX_RETRIES = 1;

// Key: prioritas process.env (dari .env.local), fallback baca engine/hermes/.env
function resolveApiKey(): string {
  if (process.env.HERMES_CUSTOM_LOCALHOST_20128_API_KEY) {
    return process.env.HERMES_CUSTOM_LOCALHOST_20128_API_KEY;
  }
  try {
    const envPath = path.join(
      process.cwd(),
      "engine",
      "hermes",
      ".env"
    );
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(
      /^HERMES_CUSTOM_LOCALHOST_20128_API_KEY\s*=\s*(.+)$/m
    );
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    // file tidak ada / tidak bisa dibaca → kosong, nanti 502 jelas
  }
  return "";
}

const API_KEY = resolveApiKey();

type ChatBody = {
  messages?: Array<{ role?: string; content?: unknown }>;
  sessionId?: string | null;
};

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

    // Kirim history penuh (bukan cuma pesan terakhir) biar konteks kebawa
    // Map role "agent" → "assistant" (OpenAI API gak kenal "agent")
    const ROLE_MAP: Record<string, string> = { agent: "assistant", error: "user" };
    const validMsgs = raw
      .filter((m) => m?.role && typeof m?.content === "string")
      .map((m) => ({
        role: ROLE_MAP[m.role!] ?? m.role!,
        content: m.content as string,
      }));

    if (validMsgs.length === 0) {
      return NextResponse.json(
        { ok: false, error: "tidak ada pesan user valid" },
        { status: 400 }
      );
    }

    // System prompt: identitas SmartDash agent
    const systemPrompt =
      "Kamu adalah SmartDash, asisten AI pribadi dashboard creator konten " +
      "all-in-one (TikTok, YouTube, Instagram, WhatsApp). Tugasmu bantu user " +
      "soal dashboard, analitik konten, automasi jadwal posting, revenue " +
      "tracker, dan hal-hal teknis project SmartDash. Jawab dengan bahasa " +
      "Indonesia yang santai dan to the point. Jangan pura-pura mengakses " +
      "data yang tidak kamu punya.";

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    // Retry 1x kalau gateway lagi sibuk / tersendat (abort atau 5xx)
    let lastErr: unknown = null;
    let res: Response | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        res = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [{ role: "system", content: systemPrompt }, ...validMsgs],
            max_tokens: 800,
            stream: false,
          }),
          signal: controller.signal,
          cache: "no-store",
        });
        lastErr = null;
        break; // sukses fetch — keluar dari loop retry
      } catch (e) {
        lastErr = e;
        if (attempt < MAX_RETRIES) {
          // sisakan jeda singkat biar gateway lepas dari antrean
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }

    if (lastErr) {
      const isAbort =
        lastErr instanceof Error && /abort/i.test(lastErr.message);
      return NextResponse.json(
        {
          ok: false,
          error: isAbort
            ? "Gateway lagi sibuk — coba lagi beberapa saat."
            : "Gagal terhubung ke gateway LLM. Pastikan gateway SmartDash aktif.",
        },
        { status: 502 }
      );
    }

    try {
      if (!res!.ok) {
        const errText = await res!.text().catch(() => "");
        return NextResponse.json(
          { ok: false, error: `Gateway error ${res!.status}: ${errText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res!.json();
      const reply =
        data?.choices?.[0]?.message?.content?.trim() ||
        "⚠️ Kosong — coba lagi.";

      return NextResponse.json({ ok: true, reply, sessionId: body.sessionId ?? null });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan tak dikenal";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}