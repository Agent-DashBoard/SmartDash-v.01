// app/inbox/page.tsx — Inbox: layout persis referensi BangBay.
// 🔒 LOCKED (11-08-2026, BangBay): desain FINAL — jangan ubah layout/garis/tombol tanpa persetujuan eksplisit BangBay.
// - Header: judul Inbox + breadcrumb, tombol Chat (dropdown) di bawah breadcrumb.
// - 2 kolom sejajar full-height: kiri = daftar chat (filter pills + list), kanan = panel percakapan (Nama Akun).
// - Garis pemisah header kiri & kanan SAMA TINGGI (h-[52px] keduanya) → sejajar sempurna.
// - Kotak full height (flex-1 stretch) sampai bawah viewport.
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

// Render pesan agent sebagai markdown (dipindah dari apps/page.tsx)
function MarkdownRenderer({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        code: ({ children }) => (
          <code className="rounded bg-[#0E1116] px-1 py-0.5 text-[12px] text-[#FBBF24]">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-lg bg-[#0E1116] p-3 text-[12px] text-[#E2E8F0]">{children}</pre>
        ),
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ---- Tipe ----
type ChatPlatform = "tiktok" | "youtube" | "instagram" | "whatsapp";
type AccountKey = ChatPlatform | "agent";
type Msg = { role: "user" | "agent" | "error"; text: string };

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
  { label: string; icon: string; img: string; color: string; connected: boolean }
> = {
  tiktok: { label: "TikTok", icon: "🎵", img: "/icons/tiktok.png", color: "#00F2EA", connected: true },
  youtube: { label: "YouTube", icon: "▶️", img: "/icons/youtube.png", color: "#FF0000", connected: true },
  instagram: { label: "Instagram", icon: "📸", img: "/icons/instagram.png", color: "#E1306C", connected: false },
  whatsapp: { label: "WhatsApp", icon: "💬", img: "/icons/whatsapp.png", color: "#25D366", connected: false },
};

// Meta untuk mode Agent (sesi AI) — icon asli dari public/icons
const AGENT_META = {
  label: "Agent",
  img: "/icons/Agent.png",
  color: "#F97316",
};

// ---- Helper: icon platform dari public/icons (PNG asli) ----
function PlatformImg({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className="h-[70%] w-[70%] object-contain"
    />
  );
}

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
  // Chat sosmed mulai KOSONG — diisi lewat tombol New Chat (belum ada API DM Zernio)
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  // Akun yang dipilih untuk DIBACA chat-nya (TikTok/YouTube/Agent) — bukan untuk chat baru
  const [account, setAccount] = useState<AccountKey>("tiktok");
  const [accountOpen, setAccountOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const now = useClock();
  const time = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  // Filter: akun yang dipilih dulu, baru Semua/Belum Dibaca.
  // PINNED/SESSIONS khusus mode AGENT — daftar sosmed urut natural.
  const accountChats = chats.filter((c) => c.platform === account);
  const ordered =
    filter === "unread" ? accountChats.filter((c) => c.unread) : accountChats;
  const filtered = ordered;
  const active = chats.find((c) => c.id === activeChatId) ?? null;

  function accountNameFor(platform: ChatPlatform) {
    const meta = PLATFORM_META[platform];
    return platform === "tiktok"
      ? "BangBay | Audio & Cuan"
      : platform === "youtube"
        ? "Bang Panjul"
        : meta.label;
  }

  function accountHandleFor(platform: ChatPlatform) {
    return platform === "tiktok"
      ? "@bangbayaudio"
      : platform === "youtube"
        ? "@smart-dashboard"
        : "";
  }

  function startChat(platform: ChatPlatform) {
    const nextId = Math.max(0, ...chats.map((c) => c.id)) + 1;
    const chat: Chat = {
      id: nextId,
      platform,
      name: accountNameFor(platform),
      handle: accountHandleFor(platform),
      preview: "Percakapan baru — belum ada pesan",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      unread: false,
    };
    setChats((prev) => [...prev, chat]);
    setActiveChatId(nextId);
    setAccount(platform); // pastikan chat baru terlihat di daftar akun tsb
    setNewChatOpen(false);
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
          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(24px,3vw,36px)] font-bold leading-[1.21] text-white">
              Inbox
            </h1>

            {/* Breadcrumb + jam + dot — SATU BARIS sejajar (gaya dashboard) */}
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#94A3B8]">
                <Link
                  href="/"
                  className="cursor-pointer transition-colors hover:text-white"
                >
                  Dashboard
                </Link>
                <span className="mx-1 text-white/30">•</span>
                <span className="text-white/60">Inbox</span>
              </p>

              {/* Jam + dot — ukuran & gaya SAMA dengan dashboard */}
              <div className="flex shrink-0 items-center gap-[10px]">
                <span className="translate-y-[1.5px] text-[15px] font-bold leading-none tracking-[0.02em] text-white">
                  {time}
                </span>
                <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-20" />
                  <span className="relative inline-flex h-[18px] w-[18px] animate-pulse-dot rounded-full bg-[#00FF2F]" />
                </span>
              </div>
            </div>

            {/* Tombol akun → dropdown PILIH AKUN yang dibaca (bukan chat baru) */}
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-[#2E3750] bg-[#232A3D] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#2E3750]"
              >
                {account === "agent" ? (
                  <>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      <PlatformImg src={AGENT_META.img} alt={AGENT_META.label} />
                    </span>
                    {AGENT_META.label}
                  </>
                ) : (
                  <>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      <PlatformImg src={PLATFORM_META[account].img} alt={PLATFORM_META[account].label} />
                    </span>
                    {PLATFORM_META[account].label}
                  </>
                )}
                <svg
                  className={`h-3 w-3 transition-transform ${accountOpen ? "rotate-180" : ""}`}
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

              {/* Dropdown — pilih akun terhubung yang chat-nya mau dibaca */}
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-[8px] border border-[#2E3750] bg-[#1C222B] shadow-xl">
                    <p className="border-b border-[#2E3750] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Pilih akun yang dibaca
                    </p>
                    {/* Agent — mode sesi AI */}
                    <button
                      type="button"
                      onClick={() => {
                        setAccount("agent");
                        setAccountOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-2.5 border-b border-[#2E3750] px-3 py-2.5 text-left transition-colors hover:bg-[#232A3D]`}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                        style={{ backgroundColor: `${AGENT_META.color}1A` }}
                      >
                        <PlatformImg src={AGENT_META.img} alt={AGENT_META.label} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-bold text-white">{AGENT_META.label}</span>
                        <span className="block truncate text-[10px] text-white/40">
                          Asisten AI SmartDash
                        </span>
                      </span>
                      {account === "agent" && (
                        <svg
                          className="h-4 w-4 shrink-0 text-[#38BDF8]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                    {(Object.keys(PLATFORM_META) as ChatPlatform[])
                      .filter((key) => PLATFORM_META[key].connected)
                      .map((key, idx, arr) => {
                        const meta = PLATFORM_META[key];
                        const selected = key === account;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setAccount(key);
                              setAccountOpen(false);
                            }}
                            className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#232A3D] ${
                              idx < arr.length - 1 ? "border-b border-[#2E3750]" : ""
                            }`}
                          >
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                              style={{ backgroundColor: `${meta.color}1A` }}
                            >
                              <PlatformImg src={meta.img} alt={meta.label} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-bold text-white">{meta.label}</span>
                              <span className="block truncate text-[10px] text-white/40">
                                {accountNameFor(key)} {accountHandleFor(key)}
                              </span>
                            </span>
                            {selected && (
                              <svg
                                className="h-4 w-4 shrink-0 text-[#38BDF8]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ===== 2 KOLOM SEJAJAR: kiri daftar chat · kanan percakapan — FULL HEIGHT ===== */}
        {account === "agent" ? (
          <AgentSessionsView />
        ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
          {/* ---- PANEL KIRI: filter + daftar chat ---- */}
          <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B] lg:min-h-0 lg:w-[320px] lg:shrink-0">
            {/* Header kiri — h-[52px] SAMA dengan header kanan → garis sejajar */}
            <div className="flex h-[52px] shrink-0 items-center gap-1.5 border-b border-[#2E3750] px-3">
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
                  className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${
                    filter === f.key
                      ? "border-[#38BDF8]/50 bg-[#38BDF8]/10 text-[#38BDF8]"
                      : "border-[#2E3750] bg-transparent text-white/70 hover:bg-[#232A3D]"
                  }`}
                >
                  {f.label}
                </button>
              ))}

              {/* Tombol New Chat — di samping pill Belum Dibaca */}
              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setNewChatOpen((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-[#38BDF8]/50 bg-[#38BDF8]/10 px-2.5 py-1 text-[11px] font-bold text-[#38BDF8] transition-colors hover:bg-[#38BDF8]/20"
                >
                  <svg
                    className="h-2.5 w-2.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New Chat
                </button>

                {/* Dropdown New Chat — pilih platform untuk chat baru */}
                {newChatOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setNewChatOpen(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-[8px] border border-[#2E3750] bg-[#1C222B] shadow-xl">
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
                                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                                style={{ backgroundColor: `${meta.color}1A` }}
                              >
                                <PlatformImg src={meta.img} alt={meta.label} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[13px] font-bold text-white">
                                  {meta.label}
                                </span>
                                <span className="block truncate text-[10px] text-white/40">
                                  {accountNameFor(key)} {accountHandleFor(key)}
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

            {/* Daftar chat sosmed — urut natural (PINNED/SESSIONS khusus Agent) */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-4 py-10 text-center">
                  <p className="text-[12px] leading-relaxed text-[#64748B]">
                    {filter === "unread"
                      ? "Tidak ada chat belum dibaca untuk akun ini."
                      : "Belum ada percakapan untuk akun ini."}
                    <br />
                    Klik <span className="font-bold text-white/60">New Chat</span> untuk memulai.
                  </p>
                </div>
              ) : (
                filtered.map((c, idx) => (
                  <ChatItem
                    key={c.id}
                    c={c}
                    meta={PLATFORM_META[c.platform]}
                    active={activeChatId === c.id}
                    onOpen={() => openChat(c.id)}
                    showBorderTop={idx > 0}
                  />
                ))
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{ backgroundColor: `${PLATFORM_META[active.platform].color}1A` }}
                  >
                    <PlatformImg
                      src={PLATFORM_META[active.platform].img}
                      alt={PLATFORM_META[active.platform].label}
                    />
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
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{ backgroundColor: `${PLATFORM_META[account].color}1A` }}
                  >
                    <PlatformImg
                      src={PLATFORM_META[account].img}
                      alt={PLATFORM_META[account].label}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-white">
                      {accountNameFor(account)}
                    </p>
                    {accountHandleFor(account) && (
                      <p className="truncate text-[11px] text-white/40">{accountHandleFor(account)}</p>
                    )}
                  </div>
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
                  Pilih percakapan dari daftar, atau klik New Chat untuk memulai.
                </p>
              )}
            </div>
          </section>
        </div>
        )}
      </div>
    </div>
  );
}

// ---- Komponen item chat sosmed (PINNED/SESSIONS khusus Agent, bukan di sini) ----
function ChatItem({
  c,
  meta,
  active,
  onOpen,
  showBorderTop,
}: {
  c: Chat;
  meta: { label: string; img: string; color: string; connected: boolean };
  active: boolean;
  onOpen: () => void;
  showBorderTop: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`group relative flex w-full cursor-pointer items-start gap-2.5 px-3 py-3 text-left transition-colors ${
        active ? "bg-[#232A3D]" : "hover:bg-[#232A3D]/60"
      } ${showBorderTop ? "border-t border-[#2E3750]" : ""}`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: `${meta.color}1A` }}
      >
        <PlatformImg src={meta.img} alt={meta.label} />
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
          {c.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#38BDF8]" />}
        </span>
        <span className="mt-1 block truncate text-[11px] text-white/50">{c.preview}</span>
      </span>
    </div>
  );
}

// ---- Mode Agent: panel chat sesi AI (komponen asli dari apps/page.tsx) ----
const AGENT_INITIAL_MSG: Msg = {
  role: "agent",
  text:
    "Halo! 👋 Aku **SmartDash**, asisten AI-mu. Aku bisa bantu soal dashboard, analitik konten, automasi, atau apa aja yang berhubungan dengan project kamu. Mau tanya apa hari ini?",
};

type AgentSession = {
  id: number;
  title: string;
  pinned?: boolean;
  hermesSessionId?: string; // resume multi-turn ke backend
};

const INITIAL_AGENT_SESSIONS: AgentSession[] = [
  { id: 1, title: "Kerangka Layout SmartDash" },
  { id: 2, title: "PR Apps" },
  { id: 3, title: "Content Performance BarChart" },
];

const AGENT_SIDEBAR_W = 260;

function AgentSessionsView() {
  const [agentSessions, setAgentSessions] = useState<AgentSession[]>(INITIAL_AGENT_SESSIONS);
  const [agentActiveSession, setAgentActiveSession] = useState(1);
  const [agentMessages, setAgentMessages] = useState<Msg[]>([AGENT_INITIAL_MSG]);
  const [agentInput, setAgentInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  // Search sesi — mirip GUI Hermes "Search sessions..."
  const [agentSearch, setAgentSearch] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = agentInput.trim();
    if (!text || agentLoading) return;

    const userMsg: Msg = { role: "user", text };
    const history: Msg[] = [...agentMessages, userMsg];
    setAgentMessages(history);
    setAgentInput("");
    setAgentLoading(true);

    try {
      const res = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role === "error" ? "user" : m.role,
            content: m.text,
          })),
          sessionId:
            agentSessions.find((s) => s.id === agentActiveSession)?.hermesSessionId ?? null,
        }),
      });
      const data = await res.json();

      if (data?.ok && typeof data.reply === "string" && data.reply.trim()) {
        setAgentMessages((prev) => [...prev, { role: "agent", text: data.reply }]);
        if (typeof data.sessionId === "string" && data.sessionId) {
          setAgentSessions((prev) =>
            prev.map((s) =>
              s.id === agentActiveSession ? { ...s, hermesSessionId: data.sessionId } : s
            )
          );
        }
      } else {
        setAgentMessages((prev) => [
          ...prev,
          { role: "error", text: `⚠️ ${data?.error || "Terjadi kesalahan — coba lagi."}` },
        ]);
      }
    } catch {
      setAgentMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: "⚠️ Gagal terhubung ke server. Pastikan gateway SmartDash aktif, lalu coba lagi.",
        },
      ]);
    } finally {
      setAgentLoading(false);
    }
  }

  // Filter search — mirip GUI Hermes: cari di title
  const searchQ = agentSearch.trim().toLowerCase();
  const allSessions = agentSessions.filter(
    (s) => !searchQ || s.title.toLowerCase().includes(searchQ)
  );
  const shownPinned = allSessions.filter((s) => s.pinned);
  const shownOthers = allSessions.filter((s) => !s.pinned);

  function handleNewSession() {
    const nextId = Math.max(0, ...agentSessions.map((s) => s.id)) + 1;
    setAgentSessions((prev) => [{ id: nextId, title: "Sesi baru" }, ...prev]);
    setAgentActiveSession(nextId);
    setAgentMessages([AGENT_INITIAL_MSG]);
  }

  function togglePin(id: number) {
    setAgentSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  }

  function renameSession(id: number) {
    const newTitle = window.prompt("Masukkan judul baru:", "");
    if (newTitle !== null) {
      setAgentSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: newTitle.trim() } : s))
      );
    }
  }

  function deleteSession(id: number) {
    setAgentSessions((prev) => prev.filter((s) => s.id !== id));
    if (agentActiveSession === id) {
      const remaining = agentSessions.filter((s) => s.id !== id);
      setAgentActiveSession(remaining[0]?.id ?? 0);
      setAgentMessages([AGENT_INITIAL_MSG]);
    }
  }

  const activeSessionData = agentSessions.find((s) => s.id === agentActiveSession);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
      {/* ===== Sidebar kiri: mirip GUI Hermes — ikon atas, search, PINNED, SESSIONS ===== */}
      <section
        className="flex min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#0E1116]"
        style={{ width: AGENT_SIDEBAR_W }}
      >
        {/* Baris ikon atas — mirip Hermes: New session / Capabilities / Messaging / Artifacts */}
        <div className="flex items-center gap-0.5 border-b border-[#2E3750] px-2 py-1.5">
          <button
            type="button"
            onClick={handleNewSession}
            title="New session (Ctrl+N)"
            aria-label="New session"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h7v7h-7z" />
            </svg>
          </button>
          <button
            type="button"
            title="Capabilities"
            aria-label="Capabilities"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />
            </svg>
          </button>
          <button
            type="button"
            title="Messaging"
            aria-label="Messaging"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>
          <button
            type="button"
            title="Artifacts"
            aria-label="Artifacts"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </button>
        </div>

        {/* Search sessions — mirip GUI Hermes */}
        <div className="px-2 pb-1.5 pt-2">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              placeholder="Search sessions..."
              className="h-7 w-full rounded-md border border-[#2E3750] bg-[#0E1116] pl-7 pr-2 text-[12px] text-white outline-none placeholder:text-[#64748B] focus:border-[#38BDF8]/60"
            />
          </div>
        </div>

        {/* Daftar sesi — PINNED di atas, SESSIONS di bawah (spacing rapat mirip Hermes) */}
        <div className="flex-1 overflow-y-auto px-1.5 pb-2">
          {shownPinned.length > 0 && (
            <>
              <p className="px-1.5 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                PINNED
              </p>
              {shownPinned.map((s) => (
                <AgentSessionItem
                  key={s.id}
                  s={s}
                  active={agentActiveSession === s.id}
                  onSelect={() => setAgentActiveSession(s.id)}
                  onPin={() => togglePin(s.id)}
                  onRename={() => renameSession(s.id)}
                  onDelete={() => deleteSession(s.id)}
                />
              ))}
              {/* Hint pin — persis GUI Hermes */}
              <p className="px-1.5 pb-1 pt-0.5 text-[10px] italic text-[#64748B]">
                Shift-click a chat to pin
              </p>
            </>
          )}

          <p className="px-1.5 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
            SESSIONS
          </p>
          {shownOthers.length === 0 ? (
            <p className="px-2 py-3 text-center text-[11px] text-[#64748B]">
              Tidak ada sesi. Klik ikon New Session untuk memulai.
            </p>
          ) : (
            shownOthers.map((s) => (
              <AgentSessionItem
                key={s.id}
                s={s}
                active={agentActiveSession === s.id}
                onSelect={() => setAgentActiveSession(s.id)}
                onPin={() => togglePin(s.id)}
                onRename={() => renameSession(s.id)}
                onDelete={() => deleteSession(s.id)}
              />
            ))
          )}
        </div>
      </section>

      {/* ===== Panel kanan: chat view ===== */}
      <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B] lg:min-h-0 lg:min-w-0 lg:flex-1">
        {/* Header sesi aktif */}
        <div className="border-b border-[#2E3750] px-4 py-2.5">
          <p className="truncate text-[13px] font-bold text-white">
            {activeSessionData?.title ?? "Pilih sesi"}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {agentMessages.length === 0 ? (
            <p className="text-center text-[12px] text-[#64748B]">
              Belum ada pesan. Mulai ketik di bawah.
            </p>
          ) : (
            agentMessages.map((m, i) => (
              <div
                key={i}
                className={`flex max-w-[80%] flex-col ${
                  m.role === "user" ? "ml-auto items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-[14px] px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#38BDF8]/15 text-white"
                      : m.role === "error"
                      ? "rounded-[8px] bg-[#EF4444]/15 text-[#FCA5A5]"
                      : "bg-[#1C222B] text-white"
                  }`}
                >
                  {m.role === "error" ? (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  ) : m.role === "agent" ? (
                    <MarkdownRenderer text={m.text} />
                  ) : (
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  )}
                </div>
                {i === agentMessages.length - 1 && agentLoading && m.role === "user" && (
                  <span className="mt-2 text-[11px] text-[#64748B]">
                    SmartDash lagi mikir...
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[#2E3750] p-3">
          <textarea
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const ev = new Event("submit", { cancelable: true, bubbles: true });
                e.currentTarget.form?.dispatchEvent(ev);
              }
            }}
            rows={1}
            autoFocus
            placeholder="Ketik pesan..."
            className="min-h-[36px] flex-1 resize-none rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-1.5 text-[13px] text-white outline-none placeholder:text-white/40 focus:border-[#38BDF8]/60"
          />
          <button
            type="submit"
            disabled={agentLoading || !agentInput.trim()}
            className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-[#38BDF8] text-[#0E1116] transition-colors ${
              agentLoading || !agentInput.trim()
                ? "cursor-not-allowed opacity-50"
                : "hover:brightness-110"
            }`}
            aria-label="Kirim"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </form>
      </section>
    </div>
  );
}

// ---- Item sesi di sidebar Agent (mirip GUI Hermes) ----
function AgentSessionItem({
  s,
  active,
  onSelect,
  onPin,
  onRename,
  onDelete,
}: {
  s: AgentSession;
  active: boolean;
  onSelect: () => void;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group flex w-full cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-left transition-colors ${
        active
          ? "bg-[#38BDF8]/20 font-semibold text-white"
          : "text-[#94A3B8] hover:bg-[#232A3D] hover:text-[#E2E8F0]"
      }`}
    >
      <span className="min-w-0 flex-1 truncate text-[12px]">{s.title}</span>
      {/* Titik tiga — aksi Pin/Rename/Delete saat hover (mirip GUI Hermes) */}
      <SessionActions
        s={s}
        active={active}
        onPin={onPin}
        onRename={onRename}
        onDelete={onDelete}
      />
    </div>
  );
}

// ---- Dropdown aksi item sesi: Pin / Rename / Delete (di bawah) ----
function SessionActions({
  s,
  active,
  onPin,
  onRename,
  onDelete,
}: {
  s: AgentSession;
  active: boolean;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`relative shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${active ? "opacity-100" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }
        }}
        aria-label="More actions (⋯)"
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-[#64748B] hover:bg-[#2A3347] hover:text-white"
      >
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </div>

      {open && (
        <div
          className="absolute top-full right-0 z-[50] mt-1 w-40 overflow-hidden rounded-md border border-[#2E3750] bg-[#1C222B] text-[11px] shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <MenuAction label={s.pinned ? "Unpin" : "Pin"} icon="📌" onClick={() => { onPin(); setOpen(false); }} />
          <MenuAction label="Rename" icon="✏️" onClick={() => { onRename(); setOpen(false); }} />
          <MenuAction label="Delete" icon="🗑️" onClick={() => { onDelete(); setOpen(false); }} danger />
        </div>
      )}
    </div>
  );
}

// ---- Item menu kecil di dropdown aksi sesi ----
function MenuAction({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors ${
        danger ? "text-[#F87171] hover:bg-[#2A3347]" : "text-[#CBD5E1] hover:bg-[#2A3347]"
      }`}
    >
      <span className="w-4 text-center">{icon}</span>
      {label}
    </button>
  );
}