// app/inbox/page.tsx — Inbox: pesan dari semua platform sosial terhubung.
// Tema konsisten dengan dashboard (dark, #0E1116 bg, card #1C222B).
// CATATAN: belum ada integrasi pesan dari Zernio → data contoh (mock) sampai API pesan aktif.
"use client";

import { useState, useEffect } from "react";

// ---- Tipe & data contoh (mock) ----
type InboxMessage = {
  id: number;
  platform: "tiktok" | "youtube" | "instagram" | "whatsapp";
  from: string;
  handle: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
  color: string;
};

const PLATFORM_LABEL: Record<InboxMessage["platform"], string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};

const PLATFORM_ICON: Record<InboxMessage["platform"], string> = {
  tiktok: "🎵",
  youtube: "▶️",
  instagram: "📸",
  whatsapp: "💬",
};

const INITIAL_MESSAGES: InboxMessage[] = [
  {
    id: 1,
    platform: "tiktok",
    from: "Customer TWS",
    handle: "@tws_lovers",
    preview: "Bang, TWS yang di video 21 Juni itu masih ada stoknya gak?",
    body: "Halo Bang! Saya lihat video review TWS-nya bagus banget. Yang casing bisa swipe TikTok itu masih ada stoknya? Harganya berapa kalau beli 2? Terima kasih!",
    time: "10:24",
    unread: true,
    color: "#00F2EA",
  },
  {
    id: 2,
    platform: "youtube",
    from: "Subscriber",
    handle: "@penonton_setia",
    preview: "Kapan upload video berikutnya? Video tes-nya singkat banget 😄",
    body: "Halo Bang, baru nemu channel ini. Kapan-kapan upload konten yang lebih panjang dong, penasaran sama review TWS lengkapnya. Sukses terus!",
    time: "08:12",
    unread: true,
    color: "#FF0000",
  },
  {
    id: 3,
    platform: "instagram",
    from: "Kolaborasi",
    handle: "@brand_partner",
    preview: "Mau ajak kolab endorse TWS, DM ya bang 🙏",
    body: "Halo BangBay! Kami dari brand aksesoris audio, tertarik kolaborasi untuk konten review produk kami. Mohon info rate card-nya ya. Terima kasih!",
    time: "Kemarin",
    unread: false,
    color: "#E1306C",
  },
  {
    id: 4,
    platform: "whatsapp",
    from: "Admin Group",
    handle: "+62 812-xxxx-xxxx",
    preview: "Notifikasi: anggota baru bergabung di grup Audio & Cuan",
    body: "Sistem: 12 anggota baru bergabung dengan grup 'Audio & Cuan Community' dalam 24 jam terakhir.",
    time: "Kemarin",
    unread: false,
    color: "#25D366",
  },
];

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
  const [messages, setMessages] = useState<InboxMessage[]>(INITIAL_MESSAGES);
  const [activeId, setActiveId] = useState<number | null>(messages[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const now = useClock();
  const time = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const filtered =
    filter === "unread" ? messages.filter((m) => m.unread) : messages;
  const active = messages.find((m) => m.id === activeId) ?? null;

  const unreadCount = messages.filter((m) => m.unread).length;

  function openMessage(id: number) {
    setActiveId(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, unread: false } : m)));
  }

  return (
    <div className="min-h-full bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <div className="flex w-full flex-col gap-2">
        {/* Header — judul kiri · jam kanan */}
        <header className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-bold leading-[1.21] text-white">
              Inbox
            </h1>
            <p className="text-[13px] text-[#94A3B8]">Dashboard • Pesan dari semua platform</p>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-white/60">
            <span className="h-[7px] w-[7px] rounded-full bg-[#22C55E]" />
            {time}
          </div>
        </header>

        {/* Ringkasan kecil */}
        <div className="grid grid-cols-3 gap-[7px]">
          <div className="rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
            <p className="text-[11px] font-semibold text-[#94A3B8]">Total Pesan</p>
            <p className="mt-1 text-[20px] font-bold leading-none text-white">{messages.length}</p>
          </div>
          <div className="rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
            <p className="text-[11px] font-semibold text-[#94A3B8]">Belum Dibaca</p>
            <p className="mt-1 text-[20px] font-bold leading-none text-[#38BDF8]">{unreadCount}</p>
          </div>
          <div className="rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
            <p className="text-[11px] font-semibold text-[#94A3B8]">Platform</p>
            <p className="mt-1 text-[20px] font-bold leading-none text-white">
              {Object.keys(PLATFORM_LABEL).length}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          {(
            [
              { key: "all", label: "Semua" },
              { key: "unread", label: "Belum dibaca" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors ${
                filter === f.key
                  ? "bg-[#38BDF8]/15 text-[#38BDF8]"
                  : "bg-transparent text-white/60 hover:bg-[#232A3D]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Daftar pesan + panel baca */}
        <div className="grid min-h-[380px] grid-cols-1 gap-2 lg:grid-cols-[320px_1fr]">
          {/* Daftar */}
          <div className="flex flex-col gap-1.5 overflow-y-auto rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-2 lg:max-h-[560px]">
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12px] text-[#64748B]">
                Tidak ada pesan.
              </p>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => openMessage(m.id)}
                  className={`flex w-full cursor-pointer items-start gap-2.5 rounded-[8px] border p-2.5 text-left transition-colors ${
                    activeId === m.id
                      ? "border-[#38BDF8]/50 bg-[#232A3D]"
                      : "border-transparent hover:bg-[#232A3D]/60"
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px]"
                    style={{ backgroundColor: `${m.color}1A` }}
                  >
                    {PLATFORM_ICON[m.platform]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-bold text-white">{m.from}</span>
                      <span className="shrink-0 text-[10px] text-[#64748B]">{m.time}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className="rounded-full px-1.5 py-px text-[9px] font-bold"
                        style={{ backgroundColor: `${m.color}1A`, color: m.color }}
                      >
                        {PLATFORM_LABEL[m.platform]}
                      </span>
                      {m.unread && <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />}
                    </span>
                    <span className="mt-1 block truncate text-[11px] text-white/50">{m.preview}</span>
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Panel baca */}
          <div className="flex flex-col rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4">
            {active ? (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-[18px]"
                    style={{ backgroundColor: `${active.color}1A` }}
                  >
                    {PLATFORM_ICON[active.platform]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-white">{active.from}</p>
                    <p className="truncate text-[12px] text-white/40">{active.handle}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ backgroundColor: `${active.color}1A`, color: active.color }}
                  >
                    {PLATFORM_LABEL[active.platform]}
                  </span>
                </div>
                <p className="mt-3 text-[11px] text-[#64748B]">{active.time}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/85">{active.body}</p>
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-[8px] bg-[#38BDF8]/15 py-2 text-[12px] font-bold text-[#38BDF8] transition-opacity hover:opacity-80"
                  >
                    Balas pesan
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-[12px] text-[#64748B]">Pilih pesan untuk dibaca.</p>
              </div>
            )}
          </div>
        </div>

        {/* Catatan jujur */}
        <div className="rounded-[10px] border border-[#2E3750] bg-[#0E1116] p-3">
          <p className="text-[10px] leading-relaxed text-white/40">
            💡 Halaman Inbox masih memakai data contoh. Begitu integrasi pesan dari Zernio (DM TikTok,
            komentar, dsb) aktif, daftar ini akan terisi otomatis dari akun terhubung.
          </p>
        </div>
      </div>
    </div>
  );
}
