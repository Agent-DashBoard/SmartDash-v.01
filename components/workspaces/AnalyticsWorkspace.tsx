"use client";

// components/workspaces/AnalyticsWorkspace.tsx
// Halaman /analytics — analisis mendalam per konten + ringkasan akun.
// Data dari useLiveData() (Zernio). Tahan kosong kalau belum ada post.
// Pola & gaya konsisten dengan RevenueWorkspace.

import { useMemo, useState } from "react";
import { useLiveData } from "@/components/dashboard/live-data";

const rupiah = (n: number) => n.toLocaleString("id-ID");

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: "#8B5CF6",
  youtube: "#EF4444",
  instagram: "#E4405F",
  whatsapp: "#22C55E",
};

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};

const PERIODS = [
  { v: "all", label: "Semua" },
  { v: "7", label: "7 Hari" },
  { v: "30", label: "30 Hari" },
];

export function AnalyticsWorkspace() {
  const live = useLiveData();
  const accounts = live.accounts ?? [];
  const posts = live.posts ?? [];

  const [period, setPeriod] = useState("30");
  const [platformFilter, setPlatformFilter] = useState("all");

  // Filter posts by period + platform
  const filteredPosts = useMemo(() => {
    const cutoff = period === "all" ? null : Date.now() - Number(period) * 24 * 3600 * 1000;
    return posts
      .filter((p) => (platformFilter === "all" ? true : p.platform === platformFilter))
      .filter((p) => (cutoff ? new Date(p.createdTime).getTime() >= cutoff : true))
      .sort((a, b) => b.createdTime.localeCompare(a.createdTime));
  }, [posts, period, platformFilter]);

  // ===== Ringkasan agregat (per akun) =====
  const totalFollowers = accounts.reduce((s, a) => s + (a.followersCount ?? 0), 0);
  const totalLikes = accounts.reduce((s, a) => s + (a.likesCount ?? 0), 0);

  // ===== Ringkasan dari posts (kalau ada) =====
  const postTotals = useMemo(() => {
    const t = { views: 0, likes: 0, comments: 0, shares: 0 };
    for (const p of filteredPosts) {
      t.likes += p.likeCount ?? 0;
      t.comments += p.commentCount ?? 0;
      t.shares += p.shareCount ?? 0;
    }
    return t;
  }, [filteredPosts]);

  const avgEngagement =
    filteredPosts.length > 0
      ? ((postTotals.likes + postTotals.comments) / filteredPosts.length).toFixed(1)
      : "—";

  // Per platform (dari posts)
  const byPlatform = useMemo(() => {
    const m: Record<string, { posts: number; likes: number; comments: number; shares: number }> = {};
    for (const p of filteredPosts) {
      if (!m[p.platform]) m[p.platform] = { posts: 0, likes: 0, comments: 0, shares: 0 };
      m[p.platform].posts += 1;
      m[p.platform].likes += p.likeCount ?? 0;
      m[p.platform].comments += p.commentCount ?? 0;
      m[p.platform].shares += p.shareCount ?? 0;
    }
    return m;
  }, [filteredPosts]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
      {/* ===== Toolbar filter ===== */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.v}
              type="button"
              onClick={() => setPeriod(p.v)}
              className={`cursor-pointer rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                period === p.v
                  ? "bg-[#4c00b2] text-white"
                  : "border border-[#2E3750] text-[#94A3B8] hover:bg-[#232A3D]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="cursor-pointer rounded-lg border border-[#2E3750] bg-[#1C222B] px-2 py-1.5 text-[12px] text-white outline-none"
        >
          <option value="all">Semua Platform</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.platform}>{PLATFORM_LABEL[a.platform] ?? a.platform}</option>
          ))}
        </select>
      </div>

      {/* ===== Kartu ringkasan ===== */}
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-5">
        <StatCard label="Total Followers" value={totalFollowers} color="#8B5CF6" />
        <StatCard label="Total Likes" value={totalLikes} color="#EF4444" />
        <StatCard label="Post (filter)" value={filteredPosts.length} color="#3B82F6" />
        <StatCard label="Engagement Post" value={avgEngagement} color="#22C55E" />
        <StatCard label="Shares" value={postTotals.shares} color="#F59E0B" />
      </div>

      {/* ===== Breakdown per platform ===== */}
      {Object.keys(byPlatform).length > 0 && (
        <div className="shrink-0 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-4">
          <h3 className="mb-3 text-[13px] font-bold text-white">Performa per Platform</h3>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
            {Object.entries(byPlatform).map(([pf, d]) => (
              <div key={pf} className="rounded-[8px] border border-[#2E3750] bg-[#0E1116] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold" style={{ color: PLATFORM_COLOR[pf] ?? "#94A3B8" }}>
                    {PLATFORM_LABEL[pf] ?? pf}
                  </span>
                  <span className="text-[11px] text-[#64748B]">{d.posts} post</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                  <MiniStat label="Likes" value={d.likes} />
                  <MiniStat label="Komen" value={d.comments} />
                  <MiniStat label="Share" value={d.shares} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Daftar konten ===== */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B]">
        <div className="border-b border-[#2E3750] px-4 py-2 text-[13px] font-bold text-white">
          Analisis Konten
        </div>
        {filteredPosts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <div className="text-[26px]">📊</div>
            <div className="text-[13px] text-white/60">Belum ada data konten untuk dianalisis.</div>
            <div className="max-w-[320px] text-[11px] leading-relaxed text-[#64748B]">
              Data post bakal muncul otomatis dari akun terhubung (TikTok/YouTube) begitu ada konten.
              Saat ini data followers & likes akun udah tampil di kartu atas.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 border-b border-[#2E3750] bg-[#1C222B]">
                <tr className="text-[11px] uppercase tracking-wide text-[#64748B]">
                  <th className="px-3 py-2 font-semibold">Konten</th>
                  <th className="px-3 py-2 font-semibold">Platform</th>
                  <th className="px-3 py-2 text-right font-semibold">Likes</th>
                  <th className="px-3 py-2 text-right font-semibold">Komentar</th>
                  <th className="px-3 py-2 text-right font-semibold">Shares</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((p) => (
                  <tr key={p.id} className="border-b border-[#232A3D] text-[12px] text-white/80 hover:bg-[#232A3D]/40">
                    <td className="max-w-[280px] px-3 py-2">
                      <div className="truncate font-semibold text-white">{p.message || "(tanpa teks)"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold" style={{ color: PLATFORM_COLOR[p.platform] ?? "#94A3B8" }}>
                        {PLATFORM_LABEL[p.platform] ?? p.platform}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{rupiah(p.likeCount ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{rupiah(p.commentCount ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{rupiah(p.shareCount ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3">
      <span className="text-[11px] text-[#64748B]">{label}</span>
      <span className="truncate text-[20px] font-bold leading-none" style={{ color }}>
        {typeof value === "number" ? rupiah(value) : value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[13px] font-bold text-white">{rupiah(value)}</span>
      <span className="text-[10px] text-[#64748B]">{label}</span>
    </div>
  );
}
