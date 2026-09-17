"use client";

// components/workspaces/StudioWorkspace.tsx
// Studio — pabrik konten otomatis. Input 2 gambar (model + barang) → bot bikin video.
// Fase sekarang: UI + pilihan gaya + mock pipeline (nanti disambung ke ffmpeg/n8n).
// Pola & gaya konsisten dengan workspace lain.

import { useState } from "react";

type TemplateStyle = "review" | "unboxing" | "showcase" | "tutorial";

const STYLE_META: Record<TemplateStyle, { label: string; desc: string; icon: string; duration: string }> = {
  review: {
    label: "Review Gear",
    desc: "2 gambar (model + barang) + voiceover + teks nama produk/harga. Paling cocok buat affiliate audio/gear.",
    icon: "🎙️",
    duration: "± 30-45 detik",
  },
  unboxing: {
    label: "Unboxing",
    desc: "Langkah buka → pamer → review singkat. Cocok buat barang baru & kesan pertama.",
    icon: "📦",
    duration: "± 45-60 detik",
  },
  showcase: {
    label: "Showcase",
    desc: "Fokus ke barang, musik background, minim teks. Buat yang mau simple & estetik.",
    icon: "✨",
    duration: "± 15-25 detik",
  },
  tutorial: {
    label: "Tutorial",
    desc: "Step-by-step cara pakai/setting. Cocok buat konten edukasi audio/gear.",
    icon: "🛠️",
    duration: "± 45-75 detik",
  },
};

const STYLE_KEYS: TemplateStyle[] = ["review", "unboxing", "showcase", "tutorial"];

const VOICE_OPTIONS = [
  { v: "default", label: "Suara AI (default)" },
  { v: "pria", label: "Suara Pria (natural)" },
  { v: "wanita", label: "Suara Wanita (natural)" },
  { v: "bangbay", label: "Suara BangBay (dilatih)" },
];

const MUSIC_OPTIONS = [
  { v: "none", label: "Tanpa Musik" },
  { v: "chill", label: "Chill / Lo-fi" },
  { v: "energik", label: "Energik (TikTok vibe)" },
  { v: "upbeat", label: "Upbeat / Happy" },
];

const CAPTION_OPTIONS = [
  { v: "baik", label: "Yang penting: nama produk + harga + CTA link di bio" },
  { v: "lengkap", label: "Lengkap: benefit + hashtag + CTA" },
  { v: "minim", label: "Minim: singkat & impactful" },
];

// Mock pipeline state (nanti diganti real ffmpeg/n8n)
type JobState = "idle" | "preview" | "progress" | "done";

export function StudioWorkspace() {
  const [style, setStyle] = useState<TemplateStyle>("review");
  const [voice, setVoice] = useState("default");
  const [music, setMusic] = useState("chill");
  const [captionLevel, setCaptionLevel] = useState("baik");
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [scriptPrompt, setScriptPrompt] = useState("");

  // Gambar
  const [modelImg, setModelImg] = useState<string | null>(null);
  const [productImg, setProductImg] = useState<string | null>(null);

  // Job state
  const [job, setJob] = useState<JobState>("idle");
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string | null) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }

  function generateContent() {
    // Validasi
    if (!modelImg || !productImg) {
      showToast("⚠️ Masukin 2 gambar dulu (model + barang)");
      return;
    }
    if (!productName.trim()) {
      showToast("⚠️ Isi nama produk dulu");
      return;
    }

    setJob("progress");
    setProgress(5);

    // Mock progres pipeline (nanti real: script → TTS → render)
    const steps = [15, 35, 55, 75, 90, 100];
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setProgress(steps[i - 1]);
      if (i >= steps.length) {
        clearInterval(timer);
        setTimeout(() => {
          setJob("done");
          showToast("🎬 Video siap! (simulasi — belum render nyata)");
        }, 300);
      }
    }, 600);
  }

  function resetJob() {
    setJob("idle");
    setProgress(0);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {/* ===== 1. Pilih Gaya ===== */}
      <div className="shrink-0">
        <span className="mb-1 block text-[11px] font-semibold text-white/60">1 · Pilih Gaya Video</span>
        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
          {STYLE_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={`cursor-pointer rounded-[10px] border p-2 text-left transition-all ${
                style === s
                  ? "border-[#4c00b2] bg-[#4c00b2]/10"
                  : "border-[#2E3750] bg-[#1C222B] hover:border-[#4c00b2]/40"
              }`}
            >
              <div className="text-[18px]">{STYLE_META[s].icon}</div>
              <div className="mt-0.5 text-[12.5px] font-bold text-white">{STYLE_META[s].label}</div>
              <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#94A3B8]">{STYLE_META[s].desc}</div>
              <div className="mt-0.5 text-[9.5px] font-semibold text-[#64748B]">{STYLE_META[s].duration}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 2. Upload 2 Gambar (flexibel — ngisi ruang kosong) ===== */}
      <div className="flex min-h-0 flex-1 flex-col">
        <span className="mb-1 block text-[11px] font-semibold text-white/60">2 · Masukin 2 Gambar</span>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5">
          <UploadBox
            label="Gambar Model"
            placeholder="Model/influencer/lu"
            image={modelImg}
            onSelect={(e) => handleFile(e, setModelImg)}
            accent="#8B5CF6"
          />
          <UploadBox
            label="Gambar Barang Affiliate"
            placeholder="Produk/gear"
            image={productImg}
            onSelect={(e) => handleFile(e, setProductImg)}
            accent="#4c00b2"
          />
        </div>
      </div>

      {/* ===== 3. Detail Konten ===== */}
      <div className="mt-6 shrink-0">
        <span className="mb-2.5 block text-[11px] font-semibold text-white/60">3 · Detail Konten</span>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama Produk *">
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="cth: Speaker JBL Go 3"
              className="w-full rounded-lg border border-[#2E3750] bg-[#1C222B] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#4c00b2]/60"
            />
          </Field>
          <Field label="Harga (opsional)">
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="cth: Rp 499rb"
              className="w-full rounded-lg border border-[#2E3750] bg-[#1C222B] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#4c00b2]/60"
            />
          </Field>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          <Field label="Suara (Voiceover)">
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-2 text-[12px] text-white outline-none"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.v} value={v.v}>{v.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Musik Background">
            <select
              value={music}
              onChange={(e) => setMusic(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-2 text-[12px] text-white outline-none"
            >
              {MUSIC_OPTIONS.map((m) => (
                <option key={m.v} value={m.v}>{m.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Caption">
            <select
              value={captionLevel}
              onChange={(e) => setCaptionLevel(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-2 text-[12px] text-white outline-none"
            >
              {CAPTION_OPTIONS.map((c) => (
                <option key={c.v} value={c.v}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-2.5">
          <Field label="Gaya/Nada tambahan (opsional)">
            <textarea
              value={scriptPrompt}
              onChange={(e) => setScriptPrompt(e.target.value)}
              placeholder="cth: gaya santai, bahasa gaul, fokus bass-nya mantap"
              rows={2}
              className="w-full resize-none rounded-lg border border-[#2E3750] bg-[#1C222B] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30 focus:border-[#4c00b2]/60"
            />
          </Field>
        </div>
      </div>

      {/* ===== 4. Generate (sticky bawah — gak pernah ke-potong) ===== */}
      <div className="sticky bottom-0 z-10 bg-[#0E1116] pb-1 pt-1.5">
        <button
          type="button"
          onClick={generateContent}
          disabled={job === "progress"}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#4c00b2] px-4 py-3 text-[14px] font-bold text-white transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {job === "progress" ? "⏳ Mengerjakan…" : "🎬 Generate Konten"}
        </button>

        {/* Progress / hasil */}
        {job === "progress" && (
          <div className="mt-2 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4">
            <div className="mb-1.5 flex justify-between text-[11px] text-[#94A3B8]">
              <span>Script → Voiceover → Edit → Render</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#232A3D]">
              <div className="h-full rounded-full bg-[#4c00b2] transition-all" style={{ width: progress + "%" }} />
            </div>
            <div className="mt-1.5 text-[10.5px] text-[#64748B]">
              {progress < 30 ? "Nulis script & caption…" : progress < 55 ? "Bikin voiceover…" : progress < 85 ? "Rakit video & efek…" : "Render & finalisasi…"}
            </div>
          </div>
        )}

        {job === "done" && (
          <div className="mt-2 rounded-[10px] border border-[#22C55E]/30 bg-[#22C55E]/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-bold text-[#22C55E]">🎬 Video siap!</div>
                <div className="mt-0.5 text-[11px] text-[#94A3B8]">
                  Gaya {STYLE_META[style].label} · {STYLE_META[style].duration} · {productName}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={resetJob} className="cursor-pointer rounded-lg border border-[#2E3750] px-3 py-1.5 text-[11px] font-bold text-[#94A3B8] hover:bg-[#232A3D]">
                  Reset
                </button>
                <button type="button" onClick={() => showToast("🔗 Nanti: link ke upload TikTok/YouTube")} className="cursor-pointer rounded-lg bg-[#4c00b2] px-3 py-1.5 text-[11px] font-bold text-white hover:brightness-110">
                  Upload →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-[#10B981] px-4 py-2 text-[12px] font-semibold text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}

function UploadBox({
  label,
  placeholder,
  image,
  onSelect,
  accent,
}: {
  label: string;
  placeholder: string;
  image: string | null;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accent: string;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-1 block text-[11px] font-semibold text-white/60">{label}</span>
      <div
        className="flex h-full min-h-[96px] items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-[#2E3750] bg-[#1C222B] transition-colors hover:border-[#4c00b2]/50"
        style={image ? { borderStyle: "solid", borderColor: accent + "66" } : undefined}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 p-3 text-center">
            <span className="text-[22px]">📤</span>
            <span className="text-[12px] font-semibold text-white/70">{placeholder}</span>
            <span className="text-[10px] text-[#64748B]">Klik untuk pilih gambar</span>
          </div>
        )}
      </div>
      <input type="file" accept="image/*" className="hidden" onChange={onSelect} />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-white/60">{label}</span>
      {children}
    </label>
  );
}