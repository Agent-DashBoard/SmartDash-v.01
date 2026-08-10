// chart-data.ts — helper data chart ASLI dari posts Zernio.
// Fallback ke mock dilakukan di komponen masing-masing (kalau gak ada posts).

import { LivePost } from "./live-data";

// Map platform internal → label tampilan
const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
};

export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

// Bar Content Performance dari posts ASLI: 8 bucket waktu antara post pertama & terakhir.
// Null kalau gak ada posts (komponen pakai mock).
export function weeklyPerformance(
  posts: LivePost[]
): Array<Record<string, number | string>> | null {
  if (!posts.length) return null;
  const sorted = [...posts].sort(
    (a, b) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()
  );
  const min = new Date(sorted[0].createdTime).getTime();
  const max = new Date(sorted[sorted.length - 1].createdTime).getTime();
  const dayMs = 86_400_000;
  const span = Math.max(max - min, dayMs); // minimal 1 hari biar bucket gak kelewat sempit
  const buckets: Array<Record<string, number | string>> = [];
  for (let i = 0; i < 8; i++) {
    const start = min + (span * i) / 8;
    const end = min + (span * (i + 1)) / 8;
    const row: Record<string, number | string> = {
      label: shortDate(new Date(start).toISOString()),
    };
    for (const p of sorted) {
      const t = new Date(p.createdTime).getTime();
      // Bucket terakhir INCLUSIVE (<= end) biar post paling baru (tepat di max) tidak hilang.
      const inBucket =
        t >= start && (i === 7 ? t <= end : t < end);
      if (inBucket) {
        const key = platformLabel(p.platform);
        row[key] = ((row[key] as number) ?? 0) + (p.likeCount ?? 0);
      }
    }
    buckets.push(row);
  }
  return buckets;
}

// Aggregate semua kolom platform per bucket jadi 1 seri "total".
// Dipakai untuk Content Performance mode "Semua Sosmed" (server + client).
export function aggregateTotal(
  buckets: Array<Record<string, number | string>> | null
): Array<{ label: string; total: number }> | null {
  if (!buckets) return null;
  return buckets.map((row) => {
    const sum = Object.entries(row)
      .filter(([k]) => k !== "label")
      .reduce((acc, [, v]) => acc + (typeof v === "number" ? v : 0), 0);
    return { label: String(row.label ?? ""), total: sum };
  });
}

// Seri engagement per post (kronologis) — untuk Area chart.
// Null kalau gak ada posts untuk platform tsb.
export function engagementSeries(
  posts: LivePost[],
  platform?: string
): Array<{ label: string; likes: number; comments: number }> | null {
  const list = platform
    ? posts.filter((p) => platformLabel(p.platform) === platform)
    : posts;
  if (!list.length) return null;
  return [...list]
    .sort((a, b) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime())
    .map((p) => ({
      label: shortDate(p.createdTime),
      likes: p.likeCount ?? 0,
      comments: p.commentCount ?? 0,
    }));
}
