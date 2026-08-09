// main-content.tsx — PERAKIT dashboard. Hanya menyusun komponen-komponen
// ke tempatnya + headbar (greeting, jam, dot hijau) + filter bar.
// Sub-komponen dipisah ke file sendiri (PR 1):
//   stat-card, engagement-metrics, content-performance, profile-card, top-posts-table.
// PENTING: posisi jam (translate-y-[1.5px]) + dot hijau #00FF2F TIDAK diubah — final.

"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "./stat-card";
import { EngagementMetricsChart } from "./engagement-metrics";
import { TargetCard } from "./target-card";
import { ContentPerformanceChart } from "./content-performance";
import { ProfileCard } from "./profile-card";
import { TopPostsTable } from "./top-posts-table";
import { DAY_RANGES, DayRange } from "./dashboard-data";
import { useLiveData } from "./live-data";

// Konfigurasi 3 kartu metric yang dirender (assembly-level)
const STAT_CARDS = [
  { label: "Follow", color: "#F97316" },
  { label: "Like", color: "#EF4444" },
  { label: "Comment", color: "#22C55E" },
];

/* ============ Helpers (headbar) ============ */

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // Update pertama lewat timeout (bukan sync) biar aman hydration + lint
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

function greetingFor(hour: number) {
  // Patokan 24 jam (standar etika/profesionalisme):
  // Good Morning  00.00–11.59
  // Good Afternoon 12.00–16.59 (batas sore/pulang kantor ±17.00)
  // Good Evening  17.00–23.59
  // Good Night TIDAK dipakai sebagai sapaan pertemuan (khusus farewell)
  if (hour >= 0 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

/* ============ Filter bar ============ */

function FilterGroup({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options?: string[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  // Kalau ada options → render dropdown; kalau tidak → tombol placeholder biasa
  const isSelect = !!options && options.length > 0;
  return (
    <div>
      {isSelect ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-[33px] w-[118px] max-w-full cursor-pointer appearance-none rounded-[6px] bg-[#D9D9D9] pl-3 pr-7 text-[13px] font-bold text-[#1a1f2e]"
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {/* Ikon panah dropdown */}
          <svg
            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1a1f2e]/60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      ) : (
        <button
          type="button"
          className="h-[33px] w-[118px] max-w-full cursor-default rounded-[6px] bg-[#D9D9D9] px-3 text-left text-[13px] font-bold text-[#6b7280]"
        >
          {placeholder}
        </button>
      )}
    </div>
  );
}

/* ============ DayRangeFilter — tombol segmented Today / Last 7 days / Last 30 days ============ */
// Menggantikan placeholder "View Per Day" — mengikuti referensi: 3 tombol identik,
// fill #D9D9D9 (senada dropdown Platform), tinggi 33px, radius 6px, teks gelap bold.
// Label "Days" dihapus (perintah BangBay) & lebar total = 338px = lebar kartu profil (kolom kanan).
function DayRangeFilter({
  value,
  onChange,
}: {
  value: DayRange;
  onChange: (v: DayRange) => void;
}) {
  return (
    <div className="flex w-[338px] max-w-full items-center gap-2">
      {DAY_RANGES.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={[
              "h-[33px] flex-1 whitespace-nowrap rounded-[6px] text-[13px] font-bold transition-colors",
              active
                ? "bg-[#F97316] text-white"
                : "bg-[#D9D9D9] text-[#1a1f2e] hover:brightness-95",
            ].join(" ")}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ============ Main (perakit) ============ */

export default function MainContent() {
  const now = useClock();
  // Fallback pakai jam PC/server biar SSR & client konsisten (Time-based = PC)
  const hour = now ? now.getHours() : new Date().getHours();
  const time = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const [platform, setPlatform] = useState("");
  // Default "Last 30 days" — pas pertama buka dashboard, semua data tampil
  // (Content Performance 8 bar W1-W8, Engagement semua bulan, stat cards akumulasi penuh)
  const [days, setDays] = useState<DayRange>("Last 30 days");

  // Data asli dari Zernio (TikTok @bangbayaudio, YouTube @smart-dashboard)
  const live = useLiveData();

  // Dropdown Platform = HANYA platform yang terintegrasi (prinsip: dashboard
  // menampilkan yang disambungkan saja). Kalau besok penyewa integrasi IG,
  // otomatis masuk daftar; kalau belum, gak muncul.
  const PLATFORM_LABELS: Record<string, string> = {
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  const connectedPlatforms = Array.from(
    new Set(live.accounts.map((a) => PLATFORM_LABELS[a.platform] ?? a.platform))
  );

  // Kalau pilihan platform tiba-tiba gak ada di daftar (mis. integrasi dilepas) → reset
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronkan pilihan dgn daftar platform terbaru
    if (platform && !connectedPlatforms.includes(platform)) setPlatform("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedPlatforms.join(",")]);

  return (
    <div className="min-h-full bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <div className="flex w-full flex-col gap-2">
        {/* Greeting + jam + status */}
        <div className="flex items-center justify-between">
          <h1 className="text-[clamp(28px,4vw,45px)] font-bold leading-[1.21] text-white">
            {greetingFor(hour)}, BangBay
          </h1>
          <div className="flex items-center gap-[10px]">
            {/* Text jam — leading-none biar line-box = font-size (center akurat) */}
            <span className="translate-y-[1.5px] text-[15px] font-bold leading-none tracking-[0.02em] text-white">{time}</span>
            {/* Dot hijau status — lebih besar (referensi 19px), berdenyut halus */}
            <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-20" />
              <span className="relative inline-flex h-[18px] w-[18px] animate-pulse-dot rounded-full bg-[#00FF2F]" />
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <FilterGroup
            placeholder="Platform"
            options={connectedPlatforms}
            value={platform}
            onChange={setPlatform}
          />
          <DayRangeFilter value={days} onChange={setDays} />
        </div>

        {/* Grid utama: kiri (stats + engagement) | kanan (profile + performance) */}
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_338px]">
          {/* Kolom kiri */}
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-[7px]">
              {STAT_CARDS.map((c) => (
                <MetricCard key={c.label} type={c.label as "Follow" | "Like" | "Comment"} platform={platform} days={days} live={live} />
              ))}
            </div>
            {/* Baris chart utama: Target (kiri, sidebar sempit) | Engagement metrics (kanan, lebar) — sesuai referensi */}
            <div className="grid flex-1 grid-cols-1 gap-2 min-[1440px]:grid-cols-[minmax(0,170px)_minmax(0,1fr)] min-[1440px]:grid-rows-[minmax(400px,1fr)]">
              <TargetCard platform={platform} days={days} />
              <EngagementMetricsChart platform={platform} days={days} />
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="flex flex-col gap-2">
            <ProfileCard platform={platform} days={days} live={live} />
            <ContentPerformanceChart
              platform={platform}
              days={days}
              connectedPlatforms={connectedPlatforms}
            />
          </div>
        </div>

        {/* Tabel top posts — full width */}
        <TopPostsTable live={live} />
      </div>
    </div>
  );
}
