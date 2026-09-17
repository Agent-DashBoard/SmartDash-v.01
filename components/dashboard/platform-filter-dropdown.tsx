// platform-filter-dropdown.tsx — dropdown pilih platform (Semua/TikTok/YouTube).
// Diletakan di topbar dashboard, sejajar greeting.
// Dipakai untuk filter stat cards + Top Performing Posts.
// Chart tetap (data non-platform). Activity Feed tetap (aktivitas pribadi).

"use client";

import { useState, useRef, useEffect } from "react";

export type PlatformFilter = "all" | "tiktok" | "youtube";

const OPTIONS: { value: PlatformFilter; label: string; icon?: string; emoji?: string; color: string }[] = [
  { value: "all", label: "Semua Platform", emoji: "🌐", color: "#94A3B8" },
  { value: "tiktok", label: "TikTok", icon: "/icons/tiktok.png", color: "#8B5CF6" },
  { value: "youtube", label: "YouTube", icon: "/icons/youtube.png", color: "#EF4444" },
];

export function PlatformFilterDropdown({
  value,
  onChange,
}: {
  value: PlatformFilter;
  onChange: (v: PlatformFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-[8px] rounded-[8px] border border-[#2E3750] bg-[#1C222B] px-[14px] py-[9px] text-[13px] font-semibold text-white transition-colors hover:border-[#4c00b2]"
      >
        <span className="flex items-center gap-2">
          {current.icon ? (
            <img src={current.icon} alt="" className="w-4 h-4 shrink-0" />
          ) : (
            <span>{current.emoji}</span>
          )}
          <span>{current.label}</span>
        </span>
        <span className="text-[#64748B]">▼</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            background: "#1C222B",
            border: "1px solid #2E3750",
            borderRadius: "8px",
            minWidth: "180px",
            padding: "5px",
            zIndex: 50,
            boxShadow: "0 10px 30px rgba(0,0,0,.45)",
          }}
        >
          {OPTIONS.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex items-center gap-[9px] rounded-[6px] px-[11px] py-[9px] cursor-pointer text-[12px] font-semibold transition-colors ${
                value === opt.value
                  ? "bg-[rgba(76,0,178,.18)] text-white"
                  : "text-[#94A3B8] hover:bg-[#232A3D] hover:text-white"
              }`}
            >
              {opt.icon ? (
                <img src={opt.icon} alt="" className="w-4 h-4 shrink-0" />
              ) : (
                <span>{opt.emoji}</span>
              )}
              <span>{opt.label}</span>
              {value === opt.value && (
                <span className="ml-auto text-[10px] text-[#4c00b2]">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
