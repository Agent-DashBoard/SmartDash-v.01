"use client";

// AgentSessionItem — item sesi di sidebar Agent + dropdown aksi Pin/Rename/Delete.
import { useState } from "react";
import type { AgentSession } from "./inbox-types";

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

export function AgentSessionItem({
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
