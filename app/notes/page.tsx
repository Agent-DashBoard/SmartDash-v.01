"use client";

import { useState, useEffect } from "react";
import { NotesWorkspace } from "@/components/workspaces/NotesWorkspace";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => { clearTimeout(first); clearInterval(id); };
  }, []);
  return now;
}

export default function NotesPage() {
  const now = useClock();
  const time = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-bold leading-[1.21] text-white">Notes</h1>
          <p className="text-[13px] text-[#94A3B8]">Dashboard • Notes</p>
        </div>
        <div className="flex items-center gap-[10px]">
          <span className="translate-y-[1.5px] text-[15px] font-bold leading-none tracking-[0.02em] text-white">{time}</span>
          <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-20" />
            <span className="relative inline-flex h-[18px] w-[18px] animate-pulse-dot rounded-full bg-[#00FF2F]" />
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <NotesWorkspace />
      </div>
    </div>
  );
}