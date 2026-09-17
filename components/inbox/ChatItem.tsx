"use client";

// ChatItem — satu item chat sosmed di daftar kiri.
import Image from "next/image";
import type { Chat, ChatPlatform, PLATFORM_META as PMType } from "./inbox-types";

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

export function ChatItem({
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
