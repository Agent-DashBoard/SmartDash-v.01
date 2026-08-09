// stat-card.tsx — kartu metric Follow / Like / Comment (dinamis ikut filter Platform + Days).
// Pemecahan dari main-content.tsx (PR 1) — tampilan IDENTIK dengan sebelumnya.

"use client";

import { useRouter } from "next/navigation";
import { PlatformIcon } from "./platform-icon";
import {
  DayRange,
  RANGE_FACTOR,
  RANGE_DELTA_FACTOR,
  RANGE_LABEL,
  parseNum,
  fmtNum,
} from "./dashboard-data";
import { LiveData } from "./live-data";

// Per-platform untuk tiap metrik (nilai angka + delta pertumbuhan + warna ikon)
const METRIC_DATA: Record<
  string,
  Record<string, { value: string; delta: string; iconKey: string; hex: string }>
> = {
  Follow: {
    TikTok: { value: "850.0K", delta: "+12.4%", iconKey: "tiktok", hex: "#00F2EA" },
    YouTube: { value: "320.0K", delta: "+8.1%", iconKey: "youtube", hex: "#FF0000" },
    Instagram: { value: "75.0K", delta: "+3.2%", iconKey: "instagram", hex: "#E1306C" },
    WhatsApp: { value: "12.0K", delta: "+0.9%", iconKey: "whatsapp", hex: "#25D366" },
  },
  Like: {
    TikTok: { value: "3.2M", delta: "+15.2%", iconKey: "tiktok", hex: "#00F2EA" },
    YouTube: { value: "1.1M", delta: "+9.7%", iconKey: "youtube", hex: "#FF0000" },
    Instagram: { value: "480K", delta: "+4.1%", iconKey: "instagram", hex: "#E1306C" },
    WhatsApp: { value: "72K", delta: "+1.5%", iconKey: "whatsapp", hex: "#25D366" },
  },
  Comment: {
    TikTok: { value: "420K", delta: "+18.9%", iconKey: "tiktok", hex: "#00F2EA" },
    YouTube: { value: "180K", delta: "+11.3%", iconKey: "youtube", hex: "#FF0000" },
    Instagram: { value: "95K", delta: "+5.6%", iconKey: "instagram", hex: "#E1306C" },
    WhatsApp: { value: "18K", delta: "+2.1%", iconKey: "whatsapp", hex: "#25D366" },
  },
};

// Gradient tema tiap kartu
const CARD_GRADIENT: Record<string, [string, string]> = {
  Follow: ["#F97316", "#B45309"],
  Like: ["#EF4444", "#B91C1C"],
  Comment: ["#22C55E", "#15803D"],
};

// Total keseluruhan (saat tidak ada platform dipilih)
const TOTAL_METRICS: Record<string, { total: string; label: string }> = {
  Follow: { total: "1.26M", label: "Total Followers" },
  Like: { total: "4.9M", label: "Total Likes" },
  Comment: { total: "713K", label: "Total Comments" },
};

const TYPE_LABEL: Record<string, string> = {
  Follow: "FOLLOWERS",
  Like: "LIKES",
  Comment: "COMMENTS",
};

const METRIC_ROUTE: Record<string, string> = {
  Follow: "/platform/followers",
  Like: "/platform/likes",
  Comment: "/platform/comments",
};

export function MetricCard({
  type,
  platform,
  days,
  live,
}: {
  type: "Follow" | "Like" | "Comment";
  platform: string;
  days: DayRange;
  live?: LiveData;
}) {
  const [from, to] = CARD_GRADIENT[type];
  const router = useRouter();
  const meta = platform && METRIC_DATA[type]?.[platform] ? METRIC_DATA[type][platform] : null;

  // ---- Data asli Zernio (kalau ada & platform cocok) ----
  const liveAcct = live?.accounts?.find(
    (a) => !platform || a.platform === platform.toLowerCase()
  );
  const livePosts = (live?.posts ?? []).filter(
    (p) => !platform || p.platform === platform.toLowerCase()
  );
  const hasLive = !!liveAcct && !live?.loading;

  let liveValue: number | null = null;
  let liveDelta: string | null = null;
  if (hasLive) {
    if (type === "Follow") {
      liveValue = liveAcct.followersCount ?? 0;
      liveDelta = liveAcct.followersLastUpdated
        ? `terakhir ${new Date(liveAcct.followersLastUpdated).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
        : null;
    } else if (type === "Like") {
      liveValue =
        liveAcct.likesCount ?? livePosts.reduce((s: number, p) => s + (p.likeCount ?? 0), 0);
      liveDelta = livePosts.length ? `${livePosts.length} video` : null;
    } else if (type === "Comment") {
      liveValue = livePosts.reduce((s: number, p) => s + (p.commentCount ?? 0), 0);
      liveDelta = livePosts.length ? `${livePosts.length} video` : null;
    }
  }

  const iconKey = meta?.iconKey ?? "total";
  const label = meta ? platform : liveAcct?.platform === "youtube" ? "YouTube" : liveAcct ? "TikTok" : "Semua Sosmed";
  const badgeHex = meta?.hex ?? from;
  // Nilai & delta diskalakan sesuai range Days (Today kecil → Last 30 days = nilai penuh)
  const factor = RANGE_FACTOR[days];
  const baseValue = meta ? meta.value : TOTAL_METRICS[type].total;
  const baseDelta = meta ? meta.delta : "+12.4%";
  const value = liveValue !== null
    ? fmtNum(liveValue * (type === "Follow" ? 1 : factor)) // Follow = snapshot asli, Like/Comment skala range
    : fmtNum(parseNum(baseValue) * factor);
  const delta = liveDelta ?? `+${(parseFloat(baseDelta) * RANGE_DELTA_FACTOR[days]).toFixed(1)}%`;
  const subText = meta
    ? `${type} ${platform} · ${RANGE_LABEL[days]}`
    : liveValue !== null && liveAcct
      ? `${type} ${liveAcct.platform === "youtube" ? "YouTube" : "TikTok"} · ${RANGE_LABEL[days]}`
      : `${TOTAL_METRICS[type].label} · ${RANGE_LABEL[days]}`;

  // Badge diklik → ke halaman tujuan (detail metric sudah ada)
  const handleBadgeClick = () => {
    const target = METRIC_ROUTE[type];
    router.push(target);
  };

  return (
    <div
      className="relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-[10px] p-3.5"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {/* Dekorasi bulatan transparan di belakang */}
      <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-black/10" />

      {/* Header: label + badge (bisa diklik → buka halaman filter per metric) */}
      <div className="relative flex items-center justify-between">
        <span className="text-[16px] font-bold text-white">{TYPE_LABEL[type]}</span>
        <button
          type="button"
          onClick={handleBadgeClick}
          title={`Buka halaman ${type} — belum tersedia`}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: `${badgeHex}25` }}
        >
          <span style={{ color: badgeHex }}>
            {iconKey === "total" ? (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="7" />
                <path d="M12 9v3l2 2" />
              </svg>
            ) : (
              <PlatformIcon type={iconKey} />
            )}
          </span>
          <span>{label}</span>
        </button>
      </div>

      {/* Nilai utama + delta */}
      <div className="relative mt-1 flex items-end justify-between">
        <div>
          <p className="text-[34px] font-bold leading-none text-white">{value}</p>
          <p className="mt-1 text-[11px] font-medium text-white/80">{subText}</p>
        </div>
        <span className="mb-0.5 rounded-md bg-white/20 px-1.5 py-0.5 text-[11px] font-bold text-white">
          ▲ {delta}
        </span>
      </div>
    </div>
  );
}

export default MetricCard;
