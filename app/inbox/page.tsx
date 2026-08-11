// app/inbox/page.tsx — Inbox: layout persis referensi BangBay.
// 🔒 LOCKED (11-08-2026, BangBay): desain FINAL — jangan ubah layout/garis/tombol tanpa persetujuan eksplisit BangBay.
// - Header: judul Inbox + breadcrumb, tombol Chat (dropdown) di bawah breadcrumb.
// - 2 kolom sejajar full-height: kiri = daftar chat (filter pills + list), kanan = panel percakapan (Nama Akun).
// - Garis pemisah header kiri & kanan SAMA TINGGI (h-[52px] keduanya) → sejajar sempurna.
// - Kotak full height (flex-1 stretch) sampai bawah viewport.
"use client";

import { useState, useEffect } from "react";

// ---- Tipe ----
type ChatPlatform = "tiktok" | "youtube" | "instagram" | "whatsapp";

type Chat = {
  id: number;
  platform: ChatPlatform;
  name: string;
  handle: string;
  preview: string;
  time: string;
  unread: boolean;
};

const PLATFORM_META: Record<
  ChatPlatform,
  { label: string; icon: string; color: string; connected: boolean }
> = {
  tiktok: { label: "TikTok", icon: "🎵", color: "#00F2EA", connected: true },
  youtube: { label: "YouTube", icon: "▶️", color: "#FF0000", connected: true },
  instagram: { label: "Instagram", icon: "📸", color: "#E1306C", connected: false },
  whatsapp: { label: "WhatsApp", icon: "💬", color: "#25D366", connected: false },
};

// ---- Hook jam (pola sama dengan dashboard) ----
function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

export default function InboxPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [chatOpen, setChatOpen] = useState(false);

  const now = useClock();
  const time = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const filtered =
    filter === "unread" ? chats.filter((c) => c.unread) : chats;
  const active = chats.find((c) => c.id === activeChatId) ?? null;

  function startChat(platform: ChatPlatform) {
    const meta = PLATFORM_META[platform];
    // Nama akun asli dari Integrations (Zernio)
    const accountName =
      platform === "tiktok"
        ? "BangBay | Audio & Cuan"
        : platform === "youtube"
          ? "Bang Panjul"
          : meta.label;
    const accountHandle =
      platform === "tiktok" ? "@bangbayaudio" : platform === "youtube" ? "@smart-dashboard" : "";
    const nextId = Math.max(0, ...chats.map((c) => c.id)) + 1;
    const chat: Chat = {
      id: nextId,
      platform,
      name: accountName,
      handle: accountHandle,
      preview: "Percakapan baru — belum ada pesan",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      unread: false,
    };
    setChats((prev) => [...prev, chat]);
    setActiveChatId(nextId);
    setChatOpen(false);
  }

  function openChat(id: number) {
    setActiveChatId(id);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: false } : c)));
  }

  return (
    <div className="flex min-h-full flex-col bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <div className="flex w-full flex-1 flex-col gap-3">
        {/* ===== HEADER: judul + breadcrumb + tombol Chat (kiri) · jam + dot (kanan) ===== */}
        <header className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-bold leading-[1.21] text-white">
              Inbox
            </h1>
            <p className="text-[13px] text-[#94A3B8]">Dashboard • Inbox</p>

            {/* Tombol Chat → dropdown platform terhubung */}
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setChatOpen((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-[#2E3750] bg-[#232A3D] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#2E3750]"
              >
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Chat
                <svg
                  className={`h-3 w-3 transition-transform ${chatOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Dropdown — hanya platform terhubung, item dipisah garis sejajar */}
              {chatOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setChatOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-[8px] border border-[#2E3750] bg-[#1C222B] shadow-xl">
                    <p className="border-b border-[#2E3750] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Mulai chat baru
                    </p>
                    {(Object.keys(PLATFORM_META) as ChatPlatform[])
                      .filter((key) => PLATFORM_META[key].connected)
                      .map((key, idx, arr) => {
                        const meta = PLATFORM_META[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => startChat(key)}
                            className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#232A3D] ${
                              idx < arr.length - 1 ? "border-b border-[#2E3750]" : ""
                            }`}
                          >
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px]"
                              style={{ backgroundColor: `${meta.color}1A` }}
                            >
                              {meta.icon}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-bold text-white">{meta.label}</span>
                              <span className="block text-[10px]" style={{ color: meta.color }}>
                                Terhubung
                              </span>
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[13px] font-medium text-white/60">
            <span>{time}</span>
            <span className="h-[7px] w-[7px] rounded-full bg-[#22C55E]" />
          </div>
        </header>

        {/* ===== 2 KOLOM SEJAJAR: kiri daftar chat · kanan percakapan — FULL HEIGHT ===== */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
          {/* ---- PANEL KIRI: filter + daftar chat ---- */}
          <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B] lg:min-h-0 lg:w-[320px] lg:shrink-0">
            {/* Header kiri — h-[52px] SAMA dengan header kanan → garis sejajar */}
            <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[#2E3750] px-3">
              {(
                [
                  { key: "all", label: "Semua" },
                  { key: "unread", label: "Belum Dibaca" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`cursor-pointer rounded-full border px-4 py-1.5 text-[12px] font-bold transition-colors ${
                    filter === f.key
                      ? "border-[#38BDF8]/50 bg-[#38BDF8]/10 text-[#38BDF8]"
                      : "border-[#2E3750] bg-transparent text-white/70 hover:bg-[#232A3D]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Daftar chat — item dipisah border-t full-width (sejajar) */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-4 py-10 text-center">
                  <p className="text-[12px] leading-relaxed text-[#64748B]">
                    Belum ada percakapan.
                    <br />
                    Klik <span className="font-bold text-white/60">Chat</span> untuk memulai.
                  </p>
                </div>
              ) : (
                filtered.map((c, idx) => {
                  const meta = PLATFORM_META[c.platform];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openChat(c.id)}
                      className={`flex w-full cursor-pointer items-start gap-2.5 px-3 py-3 text-left transition-colors ${
                        activeChatId === c.id ? "bg-[#232A3D]" : "hover:bg-[#232A3D]/60"
                      } ${idx > 0 ? "border-t border-[#2E3750]" : ""}`}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]"
                        style={{ backgroundColor: `${meta.color}1A` }}
                      >
                        {meta.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-bold text-white">{c.name}</span>
                          <span className="shrink-0 text-[10px] text-[#64748B]">{c.time}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className="rounded-full px-1.5 py-px text-[9px] font-bold"
                            style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                          >
                            {meta.label}
                          </span>
                          {c.unread && <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />}
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-white/50">{c.preview}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* ---- PANEL KANAN: Nama Akun + area percakapan — full height (flex-1) ---- */}
          <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B] lg:min-h-0 lg:min-w-0 lg:flex-1">
            {/* Header kanan — h-[52px] SAMA dengan header kiri → garis sejajar */}
            <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-[#2E3750] px-3">
              {active ? (
                <>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]"
                    style={{ backgroundColor: `${PLATFORM_META[active.platform].color}1A` }}
                  >
                    {PLATFORM_META[active.platform].icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-white">{active.name}</p>
                    {active.handle && (
                      <p className="truncate text-[11px] text-white/40">{active.handle}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <span className="h-9 w-9 shrink-0 rounded-[8px] border border-[#2E3750] bg-[#0E1116]" />
                  <p className="text-[13px] font-semibold text-[#94A3B8]">Nama Akun</p>
                </>
              )}
            </div>

            {/* Area percakapan */}
            <div className="flex flex-1 items-center justify-center p-4">
              {active ? (
                <div className="text-center">
                  <p className="text-[13px] text-[#64748B]">Belum ada pesan di percakapan ini.</p>
                  <button
                    type="button"
                    className="mt-3 cursor-pointer rounded-[8px] bg-[#38BDF8]/15 px-4 py-2 text-[12px] font-bold text-[#38BDF8] transition-opacity hover:opacity-80"
                  >
                    Balas pesan
                  </button>
                </div>
              ) : (
                <p className="text-[12px] text-[#64748B]">
                  Pilih percakapan dari daftar, atau klik Chat untuk memulai.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
