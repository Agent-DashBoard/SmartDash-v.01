// metric-detail.server.tsx — halaman detail per metrik (SERVER COMPONENT).
// DATA ASLI di-render di SERVER (via fetchLiveData) sehingga HTML pertama
// sudah berisi angka + chart asli — tanpa nunggu client-side JS.

import { Suspense } from "react";
import Link from "next/link";
import { fetchLiveData } from "@/components/dashboard/live-data.server";
import { ContentPerformanceChart } from "@/components/dashboard/content-performance";
import { EngagementMetricsChart } from "@/components/dashboard/engagement-metrics";
import { platformLabel } from "@/components/dashboard/chart-data";
import { type DetailType, META } from "@/components/platform/metric-detail-types";
import { type LiveData } from "@/components/dashboard/live-data";

// Wrapper loading — sambil tunggu data, tampilkan state
function LoadingSkeleton() {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-[10px] border border-[#2E3750] bg-[#1C222B]">
      <p className="text-[12px] text-white/40">Memuat data asli…</p>
    </div>
  );
}

export default async function MetricDetailPage({
  type,
  liveOverride,
}: {
  type: DetailType;
  // Pre-fetched data dari parent (hemat 1 round-trip). Fallback ke fetchLiveData().
  liveOverride?: LiveData;
}) {
  const live = liveOverride ?? (await fetchLiveData());
  const meta = META[type];
  const connectedPlatforms = Array.from(
    new Set(live.accounts.map((a) => platformLabel(a.platform)))
  );

  const posts = live.posts;
  const totalLikes = posts.reduce((s, p) => s + (p.likeCount ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.commentCount ?? 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.shareCount ?? 0), 0);

  // Ringkasan angka asli (ikon + nilai + label + gradient) — kartu besar di page detail
  const metricCards: Array<{ value: string; label: string; gradient: [string, string] }> =
    type === "followers"
      ? (() => {
          const primary = live.accounts.reduce((s, a) => s + (a.followersCount ?? 0), 0);
          return [
            { value: primary.toLocaleString("id-ID"), label: "Total Followers", gradient: meta.gradient },
            { value: totalLikes.toLocaleString("id-ID"), label: "Total Likes", gradient: ["#7C2D12", "#F97316"] },
            { value: totalComments.toLocaleString("id-ID"), label: "Total Komentar", gradient: ["#134E4A", "#2DD4CF"] },
          ];
        })()
      : [
          { value: totalLikes.toLocaleString("id-ID"), label: "Total Likes", gradient: ["#7C2D12", "#F97316"] },
          {
            value: (type === "comments" ? totalComments : totalShares).toLocaleString("id-ID"),
            label: type === "comments" ? "Total Komentar" : "Total Share",
            gradient: ["#134E4A", "#2DD4CF"],
          },
          {
            value: (type === "likes" ? totalComments : type === "comments" ? totalLikes : totalShares).toLocaleString(
              "id-ID"
            ),
            label: type === "likes" ? "Total Komentar" : "Total Share",
            gradient: ["#4C1D95", "#8B5CF6"],
          },
        ];

  return (
    <div className="min-h-full bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      <div className="flex w-full flex-col gap-2">
        {/* Header — judul kiri (back link + judul + breadcrumb) · jam/dot kanan */}
        <header className="flex items-center justify-between gap-2">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#38BDF8] transition-opacity hover:opacity-80"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Kembali ke Dashboard
            </Link>
            <h1 className="text-[clamp(24px,3vw,36px)] font-bold leading-[1.21] text-white">
              {meta.title}
            </h1>
            <p className="text-[13px] text-[#94A3B8]">Dashboard • {meta.title}</p>
          </div>
          <span className="text-[13px] font-medium text-white/60">
            {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </header>

        <p className="text-[12px] leading-relaxed text-white/50">{meta.desc}</p>

        {type === "performance" ? (
          <Suspense fallback={<LoadingSkeleton />}>
            <div className="rounded-[10px] border border-[#2E3750] bg-[#0E1116] p-4">
              <ContentPerformanceChart
                platform=""
                days="Last 30 days"
                connectedPlatforms={connectedPlatforms}
                live={live}
              />
            </div>
          </Suspense>
        ) : type === "engagement" ? (
          <Suspense fallback={<LoadingSkeleton />}>
            <div className="rounded-[10px] border border-[#2E3750] bg-[#0E1116] p-4">
              <EngagementMetricsChart platform="" days="Last 30 days" live={live} />
            </div>
          </Suspense>
        ) : (
          <>
            {/* Ringkasan angka asli */}
            <div className="grid grid-cols-3 gap-[7px]">
              {metricCards.map((m, idx) => (
                <div
                  key={idx}
                  className="flex min-h-[110px] flex-col justify-between overflow-hidden rounded-[10px] p-4"
                  style={{ background: `linear-gradient(135deg, ${m.gradient[0]}, ${m.gradient[1]})` }}
                >
                  <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
                  <span className="text-[26px] font-bold leading-none text-white">{m.value}</span>
                  <span className="mt-2 text-[12px] font-semibold text-white/80">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Akun terhubung */}
            <div className="flex flex-col gap-2">
              <h2 className="text-[13px] font-bold text-white">Akun Terhubung</h2>
              {live.accounts.length === 0 ? (
                <p className="text-[12px] text-white/40">
                  Belum ada akun terhubung — daftarkan di menu Integrations 🔌
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {live.accounts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3"
                    >
                      {a.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.profilePicture}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#232A3D] text-[14px] font-bold text-white/60">
                          {a.displayName?.charAt(0) ?? "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-white">
                          {a.displayName ?? a.username}
                        </p>
                        <p className="truncate text-[11px] text-white/40">@{a.username}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-[15px] font-bold text-white">
                          {a.followersCount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-[10px] text-white/40">followers</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Postingan asli */}
            <div className="flex flex-col gap-2">
              <h2 className="text-[13px] font-bold text-white">Postingan (data asli)</h2>
              {posts.length === 0 ? (
                <p className="text-[12px] text-white/40">Belum ada postingan dari akun terhubung.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {posts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-[10px] border border-[#2E3750] bg-[#1C222B] p-3"
                    >
                      {p.picture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.picture}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-[8px] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-[#232A3D] text-[18px]">
                          ▶️
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] text-white/80">{p.message}</p>
                        <p className="mt-0.5 text-[10px] text-white/35">
                          {platformLabel(p.platform)} · {p.createdTime.slice(0, 10)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-[10px] font-semibold text-white/60">
                        <span title="Likes">👍 {(p.likeCount ?? 0).toLocaleString("id-ID")}</span>
                        <span title="Komentar">💬 {(p.commentCount ?? 0).toLocaleString("id-ID")}</span>
                        <span title="Share">↗️ {(p.shareCount ?? 0).toLocaleString("id-ID")}</span>
                        {p.permalink && (
                          <a
                            href={p.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/10 px-2 py-0.5 text-[#38BDF8] transition-colors hover:bg-[#38BDF8]/20"
                          >
                            Buka
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Catatan jujur */}
        <div className="mt-1 rounded-[10px] border border-[#2E3750] bg-[#0E1116] p-3">
          <p className="text-[10px] leading-relaxed text-white/40">
            💡 Halaman ini menampilkan data asli dari akun yang terhubung via Integrations.
            Data di-render langsung di server (HTML pertama sudah berisi nilai asli).
          </p>
        </div>
      </div>
    </div>
  );
}
