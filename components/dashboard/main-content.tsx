"use client";

import { useEffect, useState } from "react";

function useClock() {
  const [now, setNow] = useState(() => new Date());          
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000); 
    return () => clearInterval(id);
  }, []);
  return now;
}

function greetingFor(hour: number) {
  if (hour >= 0 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

import ChartSection from "@/components/dashboard/ChartSection";
import { useLiveData } from "./live-data";
import { useInbox } from "./inbox-data";
import { TopPostsTable } from "./top-posts-table";
import ActivityFeed from "./activity-feed";
import { PlatformFilterDropdown, PlatformFilter } from "./platform-filter-dropdown";
import { fmtNum } from "./dashboard-data";
import { useChartData } from "./chart-data-hooks";

function Sparkline({ color, values }: { color: string; values?: number[] }) {
  // Data asli dari chart-data kalau ada; fallback garis statis lama
  const pts = values && values.length >= 2 ? values : [13, 11, 10, 8, 10, 6, 5, 3];
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  // Map ke viewBox 48×16 (padding 2px atas/bawah)
  const step = pts.length > 1 ? 48 / (pts.length - 1) : 48;
  const points = pts
    .map((v, i) => `${(i * step).toFixed(1)},${(14 - ((v - min) / range) * 12).toFixed(1)}`)
    .join(" ");
  return (
    <svg width="48" height="16" viewBox="0 0 48 16">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        points={points} />
    </svg>
  );
}

export default function MainContent() {
  const now = useClock();
  const hour = now.getHours();
  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  // Tanggal & hari dinamis (locale Indonesia) — bukan hardcode
  const dateLabel = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const live = useLiveData();
  const { items: inboxItems, unreadCount, markAsRead } = useInbox();
  // Data sparkline asli (kumulatif views/engagement per bulan) — dari Zernio
  const chartLive = useChartData("month", 31);
  // State filter platform (Semua / TikTok / YouTube) — bisa di-set dari URL ?platform=
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  // Baca query `?platform=` (dari tombol "Detail Analytics" di /social)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("platform");
    if (p === "tiktok" || p === "youtube") setPlatformFilter(p);
  }, []);

  // Akun mana yang ditampilkan berdasarkan filter
  const filteredAccount =
    live.accounts.find((a) => a.platform === platformFilter) || live.accounts[0] || null;
  const filteredPosts =
    platformFilter === "all"
      ? live.posts
      : live.posts.filter((p) => p.platform === platformFilter);

  return (
    <div className="min-h-full bg-[#0E1116] px-5 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <div className="flex w-full flex-col gap-5">
        {/* Greeting — greeting kiri, dropdown kanan (sesuai preview, tanpa span jam/dot) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div>
            <h1 className="text-[22px] sm:text-[30px] font-bold leading-[1.21] text-white">{greetingFor(hour)}, BangBay</h1>
            <p className="text-[12px] text-[#64748B] mt-[3px]">{time} — {dateLabel}</p>
          </div>

          {/* Platform Filter Dropdown */}
          <PlatformFilterDropdown
            value={platformFilter}
            onChange={setPlatformFilter}
          />
        </div>

        {/* 4 Cards — responsive full width: 2 kolom di mobile, 4 kolom dari breakpoint sm ke atas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">

          {/* Profile Card: data sesuai filter platform (fallback mock) */}
          <div
  className="flex items-stretch gap-4 px-4 py-3 bg-[#1C222B] rounded-[5px]"
  style={{ height: 125, width: "100%", maxWidth: 447 }}
>
  <img
    src={filteredAccount?.profilePicture || "https://ui-avatars.com/api/?name=BR&background=8B5CF6&color=fff&bold=true&size=198&font-size=0.6"}
    alt={filteredAccount ? `${filteredAccount.username} avatar` : "BangBay avatar"}
    className="object-cover shrink-0"
    style={{ width: 99, height: 99, borderRadius: 5 }}
  />
  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <img
          src={filteredAccount?.platform === "youtube" ? "/icons/youtube.png" : "/icons/tiktok.png"}
          alt={filteredAccount?.platform === "youtube" ? "YouTube" : "TikTok"}
          className="w-4 h-4 shrink-0"
        />
        <p className="font-bold text-white text-[15px] leading-[18px] truncate">
          {filteredAccount ? `@${filteredAccount.username}` : "@BangBay"}
        </p>
      </div>
      <p className="font-normal text-[#94A3B8] text-[11px] leading-[14px] line-clamp-2">
        {filteredAccount?.bio || "CEO & Founder SmartDash. Building the future of social media analytics."}
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
      <span className="text-[10px] leading-[12px] text-[#64748B] whitespace-nowrap">
        {filteredAccount ? `${fmtNum(filteredAccount.followersCount || 0)} followers` : "12.4K followers"}
      </span>
      <span className="text-[10px] leading-[12px] text-[#64748B] whitespace-nowrap">
        {filteredAccount ? `${fmtNum(filteredAccount.likesCount || 0)} likes` : "48.2K likes"}
      </span>
      <span className="text-[10px] leading-[12px] text-[#64748B] whitespace-nowrap">
        {filteredAccount ? `${fmtNum(filteredAccount.videoCount || 0)} shared` : "1.5K Shared"}
      </span>
    </div>
  </div>
</div>

          {/* Shared Card: 447×125, width auto */}
          <div
            className="flex flex-col px-4 py-3 bg-[#1C222B] rounded-[5px]"
            style={{ height: 125, width: 100 + "%" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-7 h-7 rounded bg-[#3B82F6]/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#3B82F6]">Shared</span>
            </div>
            <div>
              <p className="text-[18px] font-bold tracking-tight text-white">
                {filteredAccount ? fmtNum(filteredAccount.videoCount || 0) : "1.5K"}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                {chartLive.hasData && chartLive.viewsGrowthPct !== null ? (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${chartLive.viewsGrowthPct >= 0 ? "bg-[#22C55E]/10 text-[#22C55E]" : "bg-[#EF4444]/10 text-[#EF4444]"}`}>
                    {chartLive.viewsGrowthPct >= 0 ? "+" : ""}{chartLive.viewsGrowthPct.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold bg-[#22C55E]/10 text-[#22C55E] px-1.5 py-0.5 rounded">+5.2%</span>
                )}
                <Sparkline color="#3B82F6" values={chartLive.hasData ? chartLive.sparkViews.map((p) => p.value) : undefined} />
              </div>
            </div>
          </div>

          {/* Like Card */}
          <div
            className="flex flex-col px-4 py-3 bg-[#1C222B] rounded-[5px]"
            style={{ height: 125, width: 100 + "%" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-7 h-7 rounded bg-[#EF4444]/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#EF4444]">Like</span>
            </div>
            <div>
            <p className="text-[18px] font-bold tracking-tight text-white">
              {filteredAccount ? fmtNum(filteredAccount.likesCount || 0) : "48.2K"}
            </p>
            <div className="mt-1"><Sparkline color="#EF4444" values={chartLive.hasData ? chartLive.sparkEngagement.map((p) => p.value) : undefined} /></div>
            </div>
          </div>

          {/* Inbox Card — unified inbox: angka dari useInbox() (email+sosmed), klik → /inbox */}
          <a
            href="/inbox"
            className="flex flex-col px-4 py-3 bg-[#1C222B] rounded-[5px] transition-colors hover:bg-[#232A3D]"
            style={{ height: 125, width: 100 + "%" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-7 h-7 rounded bg-[#F97316]/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="#F97316" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 6L2 7" />
                </svg>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#F97316]">Inbox</span>
            </div>
            <div>
              <p className="text-[18px] font-bold tracking-tight text-white">{unreadCount}</p>
              <div className="mt-1"><span className="text-[9px] font-semibold bg-[#EF4444]/10 text-[#EF4444] px-1.5 py-0.5 rounded">unread</span></div>
            </div>
          </a>

        </div>
      </div>

      {/* Chart Section */}
      <ChartSection />

      {/* Top Performing Posts — filter sesuai platform dropdown */}
      <div className="mt-6">
        <TopPostsTable live={{ ...live, posts: filteredPosts }} platformFilter={platformFilter} />
      </div>

      {/* Activity Feed — 7 item + filter All/Unread/Today */}
      <div className="mt-6">
        <ActivityFeed inboxItems={inboxItems} onMarkRead={markAsRead} />
      </div>

    </div>
  );
}