// Client gateway Hermes lokal (OpenAI-compatible) — model Smart-Dashboard
// ⚠️ JANGAN cetak/log nilai API key — baca dari process.env aja (server-side only)
// Env: HERMES_API_ENDPOINT, HERMES_API_KEY, HERMES_MODEL (di .env.local)

const ENDPOINT = (process.env.HERMES_API_ENDPOINT || "").replace(/\/+$/, "");
const API_KEY = process.env.HERMES_API_KEY || "";
const MODEL = process.env.HERMES_MODEL || "Smart-Dashboard";
const TIMEOUT_MS = 60_000;

// Kepribadian SmartDash — dikirim sebagai pesan system pertama (branding konsisten).
// AI harus tampil sebagai SmartDash, BUKAN DeepSeek/OpenAI/model lain.
const SYSTEM_PROMPT = `Kamu adalah SmartDash, asisten AI resmi platform SmartDash — dashboard untuk kreator konten (TikTok/YouTube/Instagram/WhatsApp). Tugasmu membantu pengguna soal SmartDash, automasi, analitik, dan project mereka.

Aturan:
1. Selalu jawab dalam Bahasa Indonesia, ramah & santai.
2. JANGAN pernah bilang kamu berasal dari DeepSeek, OpenAI, Claude, atau model lain — kamu adalah SmartDash.
3. Kalau ditanya nama → jawab "SmartDash".
4. Jawab singkat, jelas, langsung to the point.
5. Kalau ditanya soal fitur SmartDash, JANGAN sebut/menjanjikan fitur yang belum tersedia (misal jadwal posting otomatis, auto-reply, notifikasi analitik — semua masih dikembangkan). Bilang saja: "Fitur itu sedang dikembangkan dan akan segera hadir di SmartDash."`;

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * Kirim riwayat chat ke otak Hermes (gateway lokal) dan ambil balasan AI.
 * Throw Error dengan pesan jelas kalau gateway mati / timeout / format aneh.
 */
export async function chatWithHermes(messages: ChatMessage[]): Promise<string> {
  if (!ENDPOINT) {
    throw new Error("HERMES_API_ENDPOINT belum di-set di .env.local");
  }
  if (!API_KEY) {
    throw new Error("HERMES_API_KEY belum di-set di .env.local");
  }

  const url = `${ENDPOINT}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        // Kepribadian SmartDash selalu jadi pesan pertama (kecuali sudah ada system)
        messages:
          messages[0]?.role === "system"
            ? messages
            : [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gateway SmartDash HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }

    // Gateway lokal kadang nempel streaming marker "data: [DONE]" di belakang JSON →
    // parse sebagai text dulu, buang marker, baru JSON.parse
    const raw = await res.text();
    let jsonText = raw.trim();
    const doneIdx = jsonText.indexOf("data: [DONE]");
    if (doneIdx >= 0) jsonText = jsonText.slice(0, doneIdx).trim();

    let data: {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    try {
      data = JSON.parse(jsonText);
    } catch {
      throw new Error(`Respon gateway bukan JSON valid: ${raw.slice(0, 200)}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Respon gateway kosong atau format tak terduga");
    }
    return content;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Gateway SmartDash timeout (${TIMEOUT_MS / 1000}s) — cek apakah gateway lokal hidup`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
