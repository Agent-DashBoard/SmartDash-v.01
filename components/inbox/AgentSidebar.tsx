"use client";

// AgentSidebar — sidebar kiri Agent mode: toolbar icons, search, PINNED + SESSIONS list.
import { useState } from "react";
import { AgentSessionItem } from "./AgentSessionItem";
import { AGENT_SIDEBAR_W, type AgentSession } from "./inbox-types";

export function AgentSidebar({
  sessions,
  activeId,
  onSelect,
  onNewSession,
  onPin,
  onRename,
  onDelete,
}: {
  sessions: AgentSession[];
  activeId: number;
  onSelect: (id: number) => void;
  onNewSession: () => void;
  onPin: (id: number) => void;
  onRename: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = sessions.filter((s) => !q || s.title.toLowerCase().includes(q));
  const pinned = filtered.filter((s) => s.pinned);
  const others = filtered.filter((s) => !s.pinned);

  return (
    <section
      className="flex min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#0E1116]"
      style={{ width: AGENT_SIDEBAR_W }}
    >
      {/* Toolbar: New Session (kiri) + Search (kanan) — satu baris, hemat tempat */}
      <div className="flex items-center gap-1.5 border-b border-[#2E3750] px-2 py-1.5">
        <button type="button" onClick={onNewSession} title="New session" aria-label="New session"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-white">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h7v7h-7z" />
          </svg>
        </button>
        <div className="relative min-w-0 flex-1">
          <svg className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className="h-7 w-full rounded-md border border-[#2E3750] bg-[#0E1116] pl-7 pr-2 text-[12px] text-white outline-none placeholder:text-[#64748B] focus:border-[#38BDF8]/60"
          />
        </div>
      </div>

      {/* Session list — PINNED + SESSIONS */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {pinned.length > 0 && (
          <>
            <p className="px-1.5 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">PINNED</p>
            {pinned.map((s) => (
              <AgentSessionItem
                key={s.id} s={s} active={activeId === s.id}
                onSelect={() => onSelect(s.id)} onPin={() => onPin(s.id)}
                onRename={() => onRename(s.id)} onDelete={() => onDelete(s.id)}
              />
            ))}
            <p className="px-1.5 pb-1 pt-0.5 text-[10px] italic text-[#64748B]">Shift-click a chat to pin</p>
          </>
        )}

        <p className="px-1.5 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">SESSIONS</p>
        {others.length === 0 ? (
          <p className="px-2 py-3 text-center text-[11px] text-[#64748B]">
            Tidak ada sesi. Klik ikon New Session untuk memulai.
          </p>
        ) : (
          others.map((s) => (
            <AgentSessionItem
              key={s.id} s={s} active={activeId === s.id}
              onSelect={() => onSelect(s.id)} onPin={() => onPin(s.id)}
              onRename={() => onRename(s.id)} onDelete={() => onDelete(s.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
