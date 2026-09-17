"use client";

// chart-data-hooks.ts — CLIENT-ONLY. Berisi hook useChartData (pakai useState/useEffect).
// Dipisah dari chart-data.ts (pure helper) supaya halaman /platform (SERVER COMPONENT)
// bisa impor helper murni tanpa ikut narik React hooks.

import { useEffect, useMemo, useState } from "react";

type RawAnalyticsPost = {
  publishedAt?: string;
  analytics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
  platforms?: { platform: string; analytics?: { views?: number; likes?: number; comments?: number; shares?: number } }[];
};

export type ChartPoint = { label: string; value: number };
export type ChartTab = "views" | "engagement" | "traffic";
export type ChartViewMode = "day" | "month" | "year";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

/** jumlah engagement satu post (likes + comments + shares + saves) */
function postEngagement(a?: RawAnalyticsPost["analytics"]) {
  if (!a) return 0;
  return (a.likes ?? 0) + (a.comments ?? 0) + (a.shares ?? 0) + (a.saves ?? 0);
}

function postViews(a?: RawAnalyticsPost["analytics"]) {
  return a?.views ?? 0;
}

/**
 * Bangun deret nilai per label untuk sebuah metric ("views" | "engagement").
 * Metric dijumlahkan dari semua post yang publishedAt jatuh pada periode tsb.
 * Untuk "traffic": total akumulatif views (kumulatif naik).
 */
function buildSeriesFromPosts(
  posts: RawAnalyticsPost[],
  metric: "views" | "engagement",
  viewMode: ChartViewMode,
  cumulative: boolean,
  dayCount: number,
): ChartPoint[] {
  const now = new Date();
  let labels: string[] = [];
  let keyFor: (p: RawAnalyticsPost) => string | null;

  if (viewMode === "day") {
    labels = Array.from({ length: dayCount }, (_, i) => String(i + 1));
    keyFor = (p) => {
      if (!p.publishedAt) return null;
      const d = new Date(p.publishedAt);
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return null;
      return String(d.getDate());
    };
  } else if (viewMode === "month") {
    labels = MONTH_LABELS;
    keyFor = (p) => {
      if (!p.publishedAt) return null;
      const d = new Date(p.publishedAt);
      if (d.getFullYear() !== now.getFullYear()) return null;
      return MONTH_LABELS[d.getMonth()];
    };
  } else {
    // year: mulai 2026 sampai tahun sekarang
    labels = Array.from({ length: now.getFullYear() - 2026 + 1 }, (_, i) => String(2026 + i));
    keyFor = (p) => (p.publishedAt ? String(new Date(p.publishedAt).getFullYear()) : null);
  }

  const buckets = new Map<string, number>();
  for (const p of posts) {
    const v = metric === "views" ? postViews(p.analytics) : postEngagement(p.analytics);
    const k = keyFor(p);
    if (!k) continue;
    buckets.set(k, (buckets.get(k) ?? 0) + v);
  }

  let running = 0;
  return labels.map((label) => {
    const delta = buckets.get(label) ?? 0;
    running += delta;
    return { label, value: cumulative ? running : delta };
  });
}

export function useChartData(viewMode: ChartViewMode, dayCount: number) {
  const [posts, setPosts] = useState<RawAnalyticsPost[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch("/api/zernio?path=analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!alive) return;
        setPosts(Array.isArray(d?.posts) ? d.posts : []);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setPosts(null);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const series = useMemo(() => {
    const src = posts ?? [];
    return {
      loading,
      hasData: !!posts && posts.length > 0,
      views: buildSeriesFromPosts(src, "views", viewMode, false, dayCount),
      engagement: buildSeriesFromPosts(src, "engagement", viewMode, false, dayCount),
      traffic: buildSeriesFromPosts(src, "views", viewMode, true, dayCount),
      totals: {
        views: src.reduce((s, p) => s + postViews(p.analytics), 0),
        engagement: src.reduce((s, p) => s + postEngagement(p.analytics), 0),
        followers: 0,
      },
      sparkViews: buildSeriesFromPosts(src, "views", "month", true, dayCount),
      sparkEngagement: buildSeriesFromPosts(src, "engagement", "month", true, dayCount),
      viewsGrowthPct: (() => {
        const monthly = buildSeriesFromPosts(src, "views", "month", false, dayCount);
        const last = monthly.filter((p) => p.value > 0);
        if (last.length < 2) return null;
        const cur = last[last.length - 1].value;
        const prev = last[last.length - 2].value;
        if (prev <= 0) return null;
        return ((cur - prev) / prev) * 100;
      })(),
    };
  }, [posts, loading, viewMode, dayCount]);

  return series;
}
