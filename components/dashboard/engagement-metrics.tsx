// engagement-metrics.tsx — stacked area chart (recharts) + timeline tanggal + animasi.
//
// - 2 seri STACKED via recharts: Comments teal (#2DD4BF) base bawah, Likes biru (#60A5FA)
//   numpuk di atas (stackId sama, urutan render comments dulu).
// - type="natural" → kurva halus ala recharts (bentuk gelombang tetep, sekarang pakai
//   library yang lebih mantap).
// - Tooltip hover + dots dari recharts (sesuai kode contoh BangBay), warna & gradient TETAP.
// - Timeline 9 tanggal + animasi dot kiri→kanan: TETAP manual (recharts gak punya itu).

"use client";

import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { PlatformIcon } from "./platform-icon";
import { PROFILE_META } from "./profile-card";
import { DayRange, RANGE_LABEL, CONTENT_PLATFORM_COLORS } from "./dashboard-data";

type EngPoint = { likes: number; comments: number };

// ---------------------------------------------------------------------------
// Data gelombang — perkembangan akun (mock): tren naik + undulasi sinus halus.
// Amplitudo undulasi BESAR (16 & 7) + frekuensi tinggi (3.5π) → lengkungan
// gelombang terasa jelas, tren tetap naik.
// ---------------------------------------------------------------------------
const N = 9; // 9 titik ↔ 9 node timeline
function buildWave(scale: number): EngPoint[] {
  return Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    return {
      likes: Math.max(2, Math.round((16 + 68 * t + 16 * Math.sin(t * Math.PI * 3.5 + 0.6)) * scale)),
      comments: Math.max(1, Math.round((6 + 28 * t + 7 * Math.sin(t * Math.PI * 3.5 + 0.6)) * scale)),
    };
  });
}

// Skala amplitudo per range Days (makin panjang range makin besar — konsisten dgn kartu metric)
const AMP_SCALE: Record<DayRange, number> = {
  Today: 0.55,
  "Last 7 days": 0.75,
  "Last 30 days": 1,
};

// Timeline — mengikuti gambar referensi BangBay
const TIMELINE_DATES = ["22/07", "23/07", "24/07", "25/07", "26/07", "27/07", "28/07", "29/07", "30/07"];
const ACTIVE_DATE = "24/07";

// Seri default (mode semua sosmed): Likes (biru) & Comments (teal)
const SERIES = [
  { key: "likes", label: "Likes", color: "#60A5FA" },
  { key: "comments", label: "Comments", color: "#2DD4BF" },
] as const;

// Faktor skala per platform (mock) — saat platform dipilih, data di-scale
const PLATFORM_SCALE: Record<string, number> = {
  TikTok: 1,
  YouTube: 0.72,
  Instagram: 0.42,
  WhatsApp: 0.18,
};

const ENGAGEMENT_ROUTE = "/platform/engagement";

// ---------------------------------------------------------------------------
// Keyframes animasi dot berjalan — dot berdenyut (scale 1.8) TEPAT saat
// melewati tiap node pin, bergerak mulus di antaranya (kiri → kanan).
// ---------------------------------------------------------------------------
const TRAVEL_KEYFRAMES = (() => {
  const frames: string[] = [
    "0% { left: 0%; transform: translate(-50%, -50%) scale(0.6); opacity: 0; }",
    "1% { transform: translate(-50%, -50%) scale(1); opacity: 1; }",
    "2% { transform: translate(-50%, -50%) scale(1.8); }",
    "4% { transform: translate(-50%, -50%) scale(1); }",
  ];
  for (let i = 1; i < TIMELINE_DATES.length - 1; i++) {
    const p = (i * 100) / (TIMELINE_DATES.length - 1);
    frames.push(`${p}% { left: ${p}%; transform: translate(-50%, -50%) scale(1); }`);
    frames.push(`${p + 2}% { transform: translate(-50%, -50%) scale(1.8); }`);
    frames.push(`${p + 4}% { transform: translate(-50%, -50%) scale(1); }`);
  }
  frames.push("97% { left: 100%; transform: translate(-50%, -50%) scale(1); }");
  frames.push("99% { transform: translate(-50%, -50%) scale(1.8); }");
  frames.push("100% { left: 100%; transform: translate(-50%, -50%) scale(0.6); opacity: 0; }");
  return frames.join("\n    ");
})();

// ---------------------------------------------------------------------------
// Komponen
// ---------------------------------------------------------------------------
export function EngagementMetricsChart({ platform, days }: { platform: string; days: DayRange }) {
  const router = useRouter();
  const hex = platform ? CONTENT_PLATFORM_COLORS[platform] ?? "#F97316" : "#F97316";
  const iconKey = platform ? PROFILE_META[platform]?.iconKey ?? "tiktok" : "total";

  // Data gelombang (selalu 9 titik ↔ 9 node timeline), amplitudo per Days.
  // Saat platform dipilih, data likes diskala sesuai PLATFORM_SCALE (mock, konsisten dgn versi lama).
  const scale = PLATFORM_SCALE[platform] ?? 1;
  const data = buildWave(AMP_SCALE[days]).map((d, i) => ({
    ...d,
    likes: platform ? Math.round(d.likes * scale) : d.likes,
    label: TIMELINE_DATES[i],
  }));

  // Seri aktif: platform dipilih → 1 seri (likes di-scale) warna platform; selain itu 2 seri.
  // URUTAN RENDER PENTING (stacking recharts): Comments = base layer (bawah), Likes = atas.
  const chartConfig: ChartConfig = platform
    ? { likes: { label: platform, color: hex } }
    : {
        comments: { label: "Comments", color: "#2DD4BF" },
        likes: { label: "Likes", color: "#60A5FA" },
      };

  // Badge diklik → halaman detail engagement (belum ada → notif)
  const handleEngClick = () => {
    router.push(ENGAGEMENT_ROUTE);
    alert("Menu Engagement belum tersedia — lagi dikerjakan 💪");
  };

  return (
    <div className="flex min-h-[400px] flex-1 flex-col rounded-[10px] bg-[#1C222B] p-4">
      {/* Header: title + badge (link kalau platform dipilih) */}
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-bold text-white">Engagement metrics</h2>
        {platform ? (
          <button
            type="button"
            onClick={handleEngClick}
            title="Buka halaman Engagement — belum tersedia"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: `${hex}25` }}
          >
            <span style={{ color: hex }}>
              <PlatformIcon type={iconKey} className="h-4 w-4" />
            </span>
            <span>{platform}</span>
          </button>
        ) : (
          <span className="rounded-full bg-[#232A3D] px-2 py-0.5 text-[9px] font-semibold text-[#94A3B8]">
            Total Semua Sosmed
          </span>
        )}
      </div>

      {/* Legend (mode semua sosmed) / label (mode single) */}
      {platform ? (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#94A3B8]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
          Tren engagement {platform} · {RANGE_LABEL[days]}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-3">
          {SERIES.map((s) => (
            <span
              key={s.key}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-[#94A3B8]"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Chart (recharts AreaChart stacked) */}
      <div className="mt-3 h-[190px]">
        <ChartContainer config={chartConfig} initialDimension={{ width: 400, height: 190 }}>
          <AreaChart
            data={data}
            margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
          >
            <defs>
              {/* Gradient TETAP ala desain lama */}
              <linearGradient id="eng-likes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={platform ? hex : "#60A5FA"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={platform ? hex : "#60A5FA"} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="eng-comments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#2E3750" strokeOpacity={0.55} strokeDasharray="3 3" />
            {/* XAxis hidden — label tanggal pakai timeline manual di bawah */}
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, "auto"]} />
            <ChartTooltip content={<ChartTooltipContent hideLabel valueFormatter={(v) => `${v}K`} />} />
            {platform ? (
              // Mode single platform: cuma 1 seri (likes di-scale) warna platform
              <Area
                dataKey="likes"
                type="natural"
                stackId="eng"
                stroke={hex}
                strokeWidth={1.8}
                fill="url(#eng-likes)"
                dot={{ r: 3, fill: hex, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: hex }}
              />
            ) : (
              <>
                {/* Comments = base layer (render pertama) */}
                <Area
                  dataKey="comments"
                  type="natural"
                  stackId="eng"
                  stroke="#2DD4BF"
                  strokeWidth={1.8}
                  fill="url(#eng-comments)"
                  dot={{ r: 3, fill: "#2DD4BF", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#2DD4BF" }}
                />
                {/* Likes = layer atas */}
                <Area
                  dataKey="likes"
                  type="natural"
                  stackId="eng"
                  stroke="#60A5FA"
                  strokeWidth={1.8}
                  fill="url(#eng-likes)"
                  dot={{ r: 3, fill: "#60A5FA", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#60A5FA" }}
                />
              </>
            )}
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Timeline tanggal (referensi: 22/07–30/07, aktif 24/07, marker hijau di node terakhir) */}
      <div className="relative mt-auto h-[44px] pt-4">
        {/* garis dasar */}
        <div className="absolute left-0 right-0 top-[5.5px] h-px bg-white/25" />
        {TIMELINE_DATES.map((d, i) => {
          const active = d === ACTIVE_DATE;
          const isLast = i === TIMELINE_DATES.length - 1;
          return (
            <div
              key={d}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${(i / (TIMELINE_DATES.length - 1)) * 100}%`, transform: "translateX(-50%)" }}
            >
              {isLast && (
                <svg className="absolute -top-[14px] h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M1.5 11 C 4 3.5, 7.5 1.5, 10.5 1.5"
                    stroke="#00FF2F"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              )}
              <div
                className={`relative z-10 h-[11px] w-[11px] rounded-full border-2 ${
                  active ? "moka-node-active border-white bg-white" : "border-white/70 bg-transparent"
                }`}
              />
              <span className={`mt-1.5 text-[9px] font-medium ${active ? "text-white" : "text-white/60"}`}>
                {d}
              </span>
            </div>
          );
        })}
        {/* animasi dot berjalan kiri → kanan (berulang) */}
        <div className="moka-travel absolute z-20 h-[9px] w-[9px] rounded-full bg-white" />
      </div>

      {/* Animasi: dot perjalanan (denyut di tiap pin) + denyut node aktif */}
      <style>{`
        @keyframes moka-travel-kf {
          ${TRAVEL_KEYFRAMES}
        }
        @keyframes moka-node-pulse-kf {
          0%, 100% { box-shadow: 0 0 4px rgba(255,255,255,0.45); }
          50%      { box-shadow: 0 0 14px rgba(255,255,255,1); }
        }
        .moka-travel {
          left: 0%;
          top: 5.5px;
          animation: moka-travel-kf 7s linear infinite;
        }
        .moka-node-active {
          animation: moka-node-pulse-kf 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default EngagementMetricsChart;
