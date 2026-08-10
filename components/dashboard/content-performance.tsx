// content-performance.tsx — BarChart recharts (shadcn-style, pola kode BangBay):
// CartesianGrid vertical=false + XAxis tickLine=false + LabelList angka di atas bar + radius 8.
// Dual-mode: platform dipilih → 1 bar warna platform; semua sosmed → bar per platform
// yang TERINTEGRASI SAJA (prinsip: dashboard menampilkan yang disambungkan saja).

"use client";

import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { PlatformIcon } from "./platform-icon";
import { PROFILE_META } from "./profile-card";
import { weeklyPerformance } from "./chart-data";
import { LiveData } from "./live-data";
import {
  DayRange,
  RANGE_WINDOW,
  RANGE_LABEL,
  CONTENT_PLATFORM_COLORS,
} from "./dashboard-data";

// Data Content Performance — total semua sosmed (mock, dalam ribuan)
const CONTENT_PERF_DATA = [
  { label: "W1", TikTok: 34, YouTube: 22, Instagram: 12, WhatsApp: 8 },
  { label: "W2", TikTok: 40, YouTube: 25, Instagram: 14, WhatsApp: 9 },
  { label: "W3", TikTok: 38, YouTube: 28, Instagram: 16, WhatsApp: 10 },
  { label: "W4", TikTok: 46, YouTube: 30, Instagram: 15, WhatsApp: 11 },
  { label: "W5", TikTok: 52, YouTube: 33, Instagram: 18, WhatsApp: 12 },
  { label: "W6", TikTok: 49, YouTube: 36, Instagram: 20, WhatsApp: 13 },
  { label: "W7", TikTok: 58, YouTube: 38, Instagram: 22, WhatsApp: 14 },
  { label: "W8", TikTok: 63, YouTube: 41, Instagram: 24, WhatsApp: 15 },
];

const CONTENT_ROUTE = "/platform/performance";

export function ContentPerformanceChart({
  platform,
  days,
  connectedPlatforms,
  live,
}: {
  platform: string;
  days: DayRange;
  // Label platform yang terintegrasi (dari live data) — chart cuma render ini
  connectedPlatforms: string[];
  // Data live Zernio — kalau ada posts, chart pakai data ASLI (weeklyPerformance)
  live?: LiveData;
}) {
  const router = useRouter();
  const hex = platform ? CONTENT_PLATFORM_COLORS[platform] ?? "#F97316" : "#F97316";
  const iconKey = platform ? PROFILE_META[platform]?.iconKey ?? "tiktok" : "total";

  // Data ASLI dari posts Zernio (8 bucket waktu antara post pertama & terakhir);
  // null kalau live undefined ATAU tidak ada post.
  const realData = live ? weeklyPerformance(live.posts ?? []) : null;
  // Untuk akun terintegrasi yang belum posting (kolom gak ada di realData),
  // tambahkan kolom = 0 di tiap bucket biar legend konsisten (transparan:
  // user lihat akun terhubung meski belum ada post).
  const realDataWithZeroCols = (() => {
    if (!live || !realData || realData.length === 0) return realData;
    const connectedLabels = connectedPlatforms; // ["TikTok", "YouTube", ...]
    const existingCols = realData.length > 0
      ? Object.keys(realData[0]).filter((k) => k !== "label")
      : [];
    const missing = connectedLabels.filter((l) => !existingCols.includes(l));
    if (missing.length === 0) return realData;
    return realData.map((row) => {
      const copy = { ...row };
      for (const m of missing) copy[m] = 0;
      return copy;
    });
  })();
  const hasRealData = realDataWithZeroCols !== null && realDataWithZeroCols.length > 0;

  // Data final: kalau live sudah ada (dari SSR atau client fetch selesai),
  // HARUS pakai data real. Mock HANYA kalau live undefined (no akun terintegrasi).
  const data = hasRealData
    ? realDataWithZeroCols
    : live && live.accounts.length === 0
      ? CONTENT_PERF_DATA.slice(-RANGE_WINDOW[days]) // live exist tapi 0 akun → mock sebagai preview
      : realDataWithZeroCols ?? []; // akun ada tapi post kosong → array kosong (chart kosong)

  // Platform yang aktif: untuk data asli = kolom platform yang ada di data;
  // untuk mock = platform terintegrasi yang punya kolom di data contoh.
  const presentColumns =
    data.length > 0
      ? Object.keys(data[0]).filter((k) => k !== "label")
      : [];
  const active = hasRealData
    ? presentColumns
    : connectedPlatforms.filter((p) =>
        (CONTENT_PERF_DATA[0] as unknown as Record<string, number>)[p] !== undefined
      );

  // Config chart — dipakai tooltip (dot + label + nilai) & label series
  // Warna series HARUS ikut warna ikon sosmed (TikTok=cyan, YouTube=red, dll)
  const chartConfig: ChartConfig = {};
  for (const p of active) {
    chartConfig[p] = {
      label: p === "total" ? "Semua Sosmed" : p,
      color: CONTENT_PLATFORM_COLORS[p] ?? "#F97316",
    };
  }
  if (platform) {
    chartConfig[platform] = { label: platform, color: hex };
  }

  // Badge diklik → halaman detail content performance
  const handleChartClick = () => {
    router.push(CONTENT_ROUTE);
  };

  return (
    <div className="flex min-h-[270px] flex-1 flex-col rounded-[10px] bg-[#1C222B] p-4">
      {/* Header: title + badge (link kalau platform dipilih) */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-white">Content Performance</h2>
        {platform ? (
          <button
            type="button"
            onClick={handleChartClick}
            title="Buka halaman Content Performance — belum tersedia"
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

      {platform ? (
        /* ===== Mode: platform dipilih → single-color bars + link ===== */
        <>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#94A3B8]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hex }} />
            Performa {platform} · {RANGE_LABEL[days]}
          </div>
          <ChartContainer config={chartConfig} className="mt-3 h-[150px]">
            <BarChart accessibilityLayer data={data} barSize={30} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} stroke="#2E3750" strokeOpacity={0.55} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fill: "#94A3B8", fontSize: 10 }}
                tickFormatter={(value) =>
                  typeof value === "string" && value.includes("/") ? value : String(value).slice(0, 3)
                }
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey={platform} fill={hex} radius={8}>
                <LabelList position="top" offset={12} className="fill-[#E2E8F0]" fontSize={12} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </>
      ) : (
        /* ===== Mode: semua sosmed → bar per platform terintegrasi ===== */
        <>
          {/* Legend platform — hanya yang terintegrasi */}
          <div className="mt-2 flex flex-wrap gap-3">
            {active.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-[#94A3B8]"
                title={
                  // Hint kalau series ini punya 0 likes (belum ada post) → user paham
                  // kenapa gak ada bar di chart.
                  data.every((row) => Number((row as Record<string, number | string>)[name] ?? 0) === 0)
                    ? `${name} — belum ada post (akun terhubung)`
                    : undefined
                }
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CONTENT_PLATFORM_COLORS[name] }} />
                {name}
              </span>
            ))}
          </div>

          {/* Bar chart — 1 sosmed = 1 bar (bukan stacked). LabelList angka muncul di Today/7d (sedikit bar) */}
          <ChartContainer config={chartConfig} className="mt-3 h-[150px]">
            <BarChart accessibilityLayer data={data} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} stroke="#2E3750" strokeOpacity={0.55} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fill: "#94A3B8", fontSize: 10 }}
                tickFormatter={(value) =>
                  typeof value === "string" && value.includes("/") ? value : String(value).slice(0, 3)
                }
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              {active.map((name) => (
                <Bar
                  key={name}
                  dataKey={name}
                  fill={chartConfig[name]?.color ?? CONTENT_PLATFORM_COLORS[name] ?? "#F97316"}
                  radius={8}
                >
                  {data.length <= 2 && (
                    <LabelList dataKey={name} position="top" offset={12} className="fill-[#E2E8F0]" fontSize={10} />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>
        </>
      )}
    </div>
  );
}

export default ContentPerformanceChart;
