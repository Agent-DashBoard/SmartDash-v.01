"use client";

// app/inbox/page.tsx — Inbox: layout persis referensi BangBay.
// 🔒 LOCKED (11-08-2026, BangBay): desain FINAL — jangan ubah layout/garis/tombol tanpa persetujuan eksplisit BangBay.
// - Header: judul Inbox + breadcrumb, tombol Chat (dropdown) di bawah breadcrumb.
// - 2 kolom sejajar full-height: kiri = daftar chat (filter pills + list), kanan = panel percakapan (Nama Akun).
// - Garis pemisah header kiri & kanan SAMA TINGGI (h-[52px] keduanya) → sejajar sempurna.
// - Kotak full height (flex-1 stretch) sampai bawah viewport.
//
// Refactored (10 Sep 2026): dipecah jadi komponen terpisah di components/inbox/.

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { EmailWorkspace } from "@/components/workspaces/EmailWorkspace";
import { AgentSidebar } from "@/components/inbox/AgentSidebar";
import { AgentChatPanel } from "@/components/inbox/AgentChatPanel";
import { RenameModal } from "@/components/inbox/RenameModal";
import { ChatItem } from "@/components/inbox/ChatItem";
import {
  PLATFORM_META,
  AGENT_META,
  AGENT_INITIAL_MSG,
  INITIAL_AGENT_SESSIONS,
  accountNameFor,
  accountHandleFor,
  type Chat,
  type ChatPlatform,
  type AccountKey,
  type Msg,
  type AgentSession,
} from "@/components/inbox/inbox-types";

// ---- Hook jam (pola sama dengan dashboard) ----
function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);
  return now;
}

// ---- Platform image helper ----
function PlatformImg({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={24} height={24} className="h-[70%] w-[70%] object-contain" />;
}

// ═══════════════════════════════════════════════════
// MAIN PAGE — Orchestrator (state management + layout)
// ═══════════════════════════════════════════════════
export default function InboxPage() {
  // Chat sosmed mulai KOSONG — diisi lewat tombol New Chat (belum ada API DM Zernio)
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  // Akun yang dipilih untuk DIBACA chat-nya (TikTok/YouTube/Email) — bukan untuk chat baru.
  // `agentActive` = mode Agent aktif (toggle terpisah). Saat agent aktif, dropdown tetap
  // nampilin akun terakhir yang dipilih (dim), dan pilih akun = otomatis keluar mode agent.
  // Persist `account` ke localStorage → pilihan STAY antar halaman.
  const STORAGE_KEY = "smartdash.inbox.account";
  const [account, setAccount] = useState<AccountKey>("tiktok");
  const [hydrated, setHydrated] = useState(false);
  const [agentActive, setAgentActive] = useState(false);
  const activeAccount: AccountKey = agentActive ? "agent" : account;
  // `account` gak pernah "agent" lagi — selalu platform/email. TypeError guard biar TS tenang:
  const platformKey: ChatPlatform = account === "email" ? "tiktok" : (account as ChatPlatform);
  // Hydration-safe: baca localStorage SETELAH mount (bukan saat init state).
  // → server & client render HTML sama dulu (default "tiktok"), baru client update akun dari simpanan.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "email" || saved === "tiktok" || saved === "youtube") {
      setAccount(saved as AccountKey);
    }
    setHydrated(true);
  }, []);
  // Simpan pilihan ke localStorage setiap ganti — skip saat mount (hydrated masih false)
  // biar gak nimpa simpanan user dengan default "tiktok"
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, account);
  }, [account, hydrated]);
  // Sinkron antar tab: kalau tab lain ganti akun, tab ini ikut (event storage fire di tab lain)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        const v = e.newValue as AccountKey;
        if (v === "email" || v === "tiktok" || v === "youtube") setAccount(v);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const [accountOpen, setAccountOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const now = useClock();
  const time = now ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--";

  // Filter: akun yang dipilih dulu, baru Semua/Belum Dibaca.
  const accountChats = chats.filter((c) => c.platform === account);
  const filtered = filter === "unread" ? accountChats.filter((c) => c.unread) : accountChats;
  const active = chats.find((c) => c.id === activeChatId) ?? null;

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
    setAccount(platform);
    setAgentActive(false);
    setNewChatOpen(false);
  }

  function openChat(id: number) {
    setActiveChatId(id);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: false } : c)));
  }

  // ═══ Agent state (dikelola di sini, dikirim ke komponen) ═══
  const [agentSessions, setAgentSessions] = useState<AgentSession[]>(INITIAL_AGENT_SESSIONS);
  const [agentActiveSession, setAgentActiveSession] = useState(0);
  // Messages PER SESI (map keyed by session id) — jangan share satu array:
  // pindah sesi = history masing-masing, gak ada pesan nyasar ke sesi lain
  const [agentMsgsMap, setAgentMsgsMap] = useState<Record<number, Msg[]>>({});
  const agentMessages = agentMsgsMap[agentActiveSession] ?? [AGENT_INITIAL_MSG];
  const [agentInput, setAgentInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: number; current: string } | null>(null);

  async function handleAgentSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = agentInput.trim();
    if (!text || agentLoading) return;

    // Auto-create sesi kalau belum ada sesi aktif (mis. pas baru pertama kali buka)
    let activeId = agentActiveSession;
    if (!agentSessions.some((s) => s.id === activeId)) {
      const nextId = Math.max(0, ...agentSessions.map((s) => s.id)) + 1;
      setAgentSessions((prev) => [{ id: nextId, title: "Sesi baru" }, ...prev]);
      setAgentActiveSession(nextId);
      activeId = nextId;
    }

    const userMsg: Msg = { role: "user", text };
    const history: Msg[] = [...(agentMsgsMap[activeId] ?? [AGENT_INITIAL_MSG]), userMsg];
    setAgentMsgsMap((prev) => ({ ...prev, [activeId]: history }));
    setAgentInput("");
    setAgentLoading(true);

    // Auto-retry: gateway kadang sibuk & timeout → coba ulang sekali sebelum error
    const payload = {
      messages: history.map((m) => ({ role: m.role === "error" ? "user" : m.role, content: m.text })),
      sessionId: agentSessions.find((s) => s.id === activeId)?.hermesSessionId ?? null,
    };

    let lastErr: string | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/hermes/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data?.ok && typeof data.reply === "string" && data.reply.trim()) {
          const replyMsg: Msg = { role: "agent", text: data.reply };
          const sid = activeId;
          setAgentMsgsMap((prev) => ({
            ...prev,
            [sid]: [...(prev[sid] ?? [AGENT_INITIAL_MSG]), replyMsg],
          }));
          if (typeof data.sessionId === "string" && data.sessionId) {
            setAgentSessions((prev) =>
              prev.map((s) => (s.id === sid ? { ...s, hermesSessionId: data.sessionId } : s))
            );
          }
          setAgentLoading(false);
          return;
        } else {
          lastErr = data?.error || "Terjadi kesalahan — coba lagi.";
        }
      } catch (err) {
        lastErr =
          err instanceof DOMException && err.name === "AbortError"
            ? "Request terputus — coba kirim ulang."
            : "Gagal terhubung ke server. Pastikan gateway SmartDash aktif.";
      }
      // jeda singkat sebelum retry (kecilin beban kalau gateway lagi penuh)
      await new Promise((r) => setTimeout(r, 1000));
    }

    setAgentMsgsMap((prev) => ({
      ...prev,
      [activeId]: [
        ...(prev[activeId] ?? [AGENT_INITIAL_MSG]),
        { role: "error", text: `⚠️ ${lastErr}` },
      ],
    }));
    setAgentLoading(false);
  }

  function handleNewAgentSession() {
    const nextId = Math.max(0, ...agentSessions.map((s) => s.id)) + 1;
    setAgentSessions((prev) => [{ id: nextId, title: "Sesi baru" }, ...prev]);
    setAgentActiveSession(nextId);
    setAgentMsgsMap((prev) => ({ ...prev, [nextId]: [AGENT_INITIAL_MSG] }));
  }

  function handlePinAgent(id: number) {
    setAgentSessions((prev) => prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)));
  }

  function handleRenameAgent(id: number) {
    const s = agentSessions.find((x) => x.id === id);
    if (s) setRenameTarget({ id, current: s.title });
  }

  function handleSubmitRename(newTitle: string) {
    const t = newTitle.trim();
    if (renameTarget && t) {
      setAgentSessions((prev) => prev.map((s) => (s.id === renameTarget.id ? { ...s, title: t } : s)));
    }
    setRenameTarget(null);
  }

  function handleDeleteAgent(id: number) {
    setAgentSessions((prev) => prev.filter((s) => s.id !== id));
    setAgentMsgsMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (agentActiveSession === id) {
      const remaining = agentSessions.filter((s) => s.id !== id);
      setAgentActiveSession(remaining[0]?.id ?? 0);
      // history sesi yang tersisa tetap utuh (masih ada di map)
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <div className="flex w-full flex-1 flex-col gap-3">
        {/* ===== HEADER ===== */}
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(24px,3vw,36px)] font-bold leading-[1.21] text-white">Inbox</h1>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#94A3B8]">
                <Link href="/" className="cursor-pointer transition-colors hover:text-white">Dashboard</Link>
                <span className="mx-1 text-white/30">•</span>
                <span className="text-white/60">Inbox</span>
              </p>
              <div className="flex shrink-0 items-center gap-[10px]">
                <span className="translate-y-[1.5px] text-[15px] font-bold leading-none tracking-[0.02em] text-white">{time}</span>
                <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-20" />
                  <span className="relative inline-flex h-[18px] w-[18px] animate-pulse-dot rounded-full bg-[#00FF2F]" />
                </span>
              </div>
            </div>

            {/* Mode & Account selector: Toggle Agent (kiri) + Dropdown akun terhubung (kanan) */}
            <div className="relative mt-2 flex items-center gap-2">
              {/* Toggle Agent — terpisah dari dropdown akun */}
              <button
                type="button"
                onClick={() => setAgentActive(true)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-[8px] border px-4 py-2 text-[12px] font-bold transition-colors ${
                  agentActive
                    ? "border-[#F97316]/60 bg-[#F97316]/15 text-[#FB923C]"
                    : "border-[#2E3750] bg-[#232A3D] text-white hover:bg-[#2E3750]"
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                  <PlatformImg src={AGENT_META.img} alt={AGENT_META.label} />
                </span>
                {AGENT_META.label}
              </button>

              {/* Dropdown akun terhubung */}
              <div className="relative">
                <button type="button" onClick={() => setAccountOpen((v) => !v)}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-[8px] border px-4 py-2 text-[12px] font-bold transition-colors ${
                    agentActive
                      ? "border-[#2E3750] bg-[#1C222B] text-white/60 hover:bg-[#232A3D]"
                      : "border-[#2E3750] bg-[#232A3D] text-white hover:bg-[#2E3750]"
                  }`}>
                  {account === "email" ? (
                    <><span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3B82F6]/1A"><svg className="h-3 w-3 text-[#3B82F6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></span>Email</>
                  ) : (
                    <><span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full"><PlatformImg src={PLATFORM_META[platformKey].img} alt={PLATFORM_META[platformKey].label} /></span>{PLATFORM_META[platformKey].label}</>
                  )}
                  <svg className={`h-3 w-3 transition-transform ${accountOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
                </button>

                {accountOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-[8px] border border-[#2E3750] bg-[#1C222B] shadow-xl">
                      <p className="border-b border-[#2E3750] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Akun terhubung</p>
                      {(Object.keys(PLATFORM_META) as ChatPlatform[])
                        .filter((key) => PLATFORM_META[key].connected)
                        .map((key, idx, arr) => {
                          const meta = PLATFORM_META[key];
                          // Pilih akun → langsung keluar mode agent
                          const selected = key === account;
                          return (
                            <button key={key} type="button" onClick={() => { setAccount(key); setAgentActive(false); setAccountOpen(false); }}
                              className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#232A3D] ${idx < arr.length - 1 ? "border-b border-[#2E3750]" : ""}`}>
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: `${meta.color}1A` }}><PlatformImg src={meta.img} alt={meta.label} /></span>
                              <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-white">{meta.label}</span><span className="block truncate text-[10px] text-white/40">{accountNameFor(key)} {accountHandleFor(key)}</span></span>
                              {selected && <svg className="h-4 w-4 shrink-0 text-[#38BDF8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>}
                            </button>
                          );
                        })}
                      <div className="border-t border-[#2E3750]">
                        <button type="button" onClick={() => { setAccount("email"); setAgentActive(false); setAccountOpen(false); }} className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#232A3D]">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3B82F6]/1A"><svg className="h-4 w-4 text-[#3B82F6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></span>
                          <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-white">Email</span><span className="block truncate text-[10px] text-white/40">Klien email SmartDash</span></span>
                          {account === "email" && <svg className="h-4 w-4 shrink-0 text-[#38BDF8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ===== 2 KOLOM ===== */}
        {agentActive ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
            <AgentSidebar
              sessions={agentSessions} activeId={agentActiveSession}
              onSelect={setAgentActiveSession} onNewSession={handleNewAgentSession}
              onPin={handlePinAgent} onRename={handleRenameAgent} onDelete={handleDeleteAgent}
            />
            <AgentChatPanel
              sessions={agentSessions} activeSessionId={agentActiveSession}
              messages={agentMessages} input={agentInput} loading={agentLoading}
              onInputChange={setAgentInput} onSubmit={handleAgentSubmit}
            />
            {renameTarget && (
              <RenameModal current={renameTarget.current} onSave={handleSubmitRename} onCancel={() => setRenameTarget(null)} />
            )}
          </div>
        ) : account === "email" ? (
          <EmailWorkspace />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row">
            {/* Panel kiri: filter + daftar chat */}
            <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B] lg:min-h-0 lg:w-[320px] lg:shrink-0">
              <div className="flex h-[52px] shrink-0 items-center gap-1.5 border-b border-[#2E3750] px-3">
                {([{ key: "all" as const, label: "Semua" }, { key: "unread" as const, label: "Belum Dibaca" }]).map((f) => (
                  <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                    className={`cursor-pointer whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold transition-colors ${filter === f.key ? "border-[#38BDF8]/50 bg-[#38BDF8]/10 text-[#38BDF8]" : "border-[#2E3750] bg-transparent text-white/70 hover:bg-[#232A3D]"}`}>
                    {f.label}
                  </button>
                ))}
                <div className="relative ml-auto">
                  <button type="button" onClick={() => setNewChatOpen((v) => !v)}
                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-[#38BDF8]/50 bg-[#38BDF8]/10 px-2.5 py-1 text-[11px] font-bold text-[#38BDF8] transition-colors hover:bg-[#38BDF8]/20">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                    New Chat
                  </button>
                  {newChatOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setNewChatOpen(false)} />
                      <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-[8px] border border-[#2E3750] bg-[#1C222B] shadow-xl">
                        <p className="border-b border-[#2E3750] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Mulai chat baru</p>
                        {(Object.keys(PLATFORM_META) as ChatPlatform[]).filter((key) => PLATFORM_META[key].connected).map((key, idx, arr) => {
                          const meta = PLATFORM_META[key];
                          return (
                            <button key={key} type="button" onClick={() => startChat(key)}
                              className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#232A3D] ${idx < arr.length - 1 ? "border-b border-[#2E3750]" : ""}`}>
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: `${meta.color}1A` }}><PlatformImg src={meta.img} alt={meta.label} /></span>
                              <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-white">{meta.label}</span><span className="block truncate text-[10px] text-white/40">{accountNameFor(key)} {accountHandleFor(key)}</span></span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center px-4 py-10 text-center">
                    <p className="text-[12px] leading-relaxed text-[#64748B]">
                      {filter === "unread" ? "Tidak ada chat belum dibaca untuk akun ini." : "Belum ada percakapan untuk akun ini."}<br />
                      Klik <span className="font-bold text-white/60">New Chat</span> untuk memulai.
                    </p>
                  </div>
                ) : (
                  filtered.map((c, idx) => (
                    <ChatItem key={c.id} c={c} meta={PLATFORM_META[c.platform]} active={activeChatId === c.id} onOpen={() => openChat(c.id)} showBorderTop={idx > 0} />
                  ))
                )}
              </div>
            </section>

            {/* Panel kanan: percakapan */}
            <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B] lg:min-h-0 lg:min-w-0 lg:flex-1">
              <div className="flex h-[52px] shrink-0 items-center gap-3 border-b border-[#2E3750] px-3">
                {active ? (
                  <><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: `${PLATFORM_META[active.platform].color}1A` }}><PlatformImg src={PLATFORM_META[active.platform].img} alt={PLATFORM_META[active.platform].label} /></span><div className="min-w-0"><p className="truncate text-[13px] font-bold text-white">{active.name}</p>{active.handle && <p className="truncate text-[11px] text-white/40">{active.handle}</p>}</div></>
                ) : (
                  <><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: `${PLATFORM_META[platformKey].color}1A` }}><PlatformImg src={PLATFORM_META[platformKey].img} alt={PLATFORM_META[platformKey].label} /></span><div className="min-w-0"><p className="truncate text-[13px] font-bold text-white">{accountNameFor(platformKey)}</p>{accountHandleFor(platformKey) && <p className="truncate text-[11px] text-white/40">{accountHandleFor(platformKey)}</p>}</div></>
                )}
              </div>
              <div className="flex flex-1 items-center justify-center p-4">
                {active ? (
                  <div className="text-center">
                    <p className="text-[13px] text-[#64748B]">Belum ada pesan di percakapan ini.</p>
                    <button type="button" className="mt-3 cursor-pointer rounded-[8px] bg-[#38BDF8]/15 px-4 py-2 text-[12px] font-bold text-[#38BDF8] transition-opacity hover:opacity-80">Balas pesan</button>
                  </div>
                ) : (
                  <p className="text-[12px] text-[#64748B]">Pilih percakapan dari daftar, atau klik New Chat untuk memulai.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
