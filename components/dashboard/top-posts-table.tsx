// top-posts-table.tsx — Top Performing Posts sebagai CARD GRID (sesuai
// docs/top-posts-cards-preview.html yang di-ACC user).
// PENTING: ukuran/warna kritis pakai INLINE STYLE & <style jsx> — BUKAN kelas
// Tailwind arbitrary. Pelajaran dari bug "elemen invisible": kelas seperti
// h-[120px]/min-h-[32px]/border-[#hex] bisa TIDAK ter-generate oleh engine CSS
// dan elemennya kolaps tanpa error. Dengan inline style, tampilan pasti sama
// dengan preview di layar mana pun.
//
// REV: total kartu selalu 12 (data live asli di depan, sisanya diisi filler
// dummy). SEBELUMNYA pakai scroll container dengan tinggi diukur px
// (ResizeObserver) supaya cuma 8 kartu keliatan — ternyata tetap ketemu sisa
// 1-2px "sliver" kartu baris ke-3 nongol karena sub-pixel rounding browser,
// gak bisa 100% presisi walau diukur otomatis.
//
// GANTI PENDEKATAN: tombol "Lihat Semua / Lihat Lebih Sedikit". Baris ke-3
// (kartu 9-12) BENERAN gak dirender ke DOM sama sekali saat collapsed — jadi
// gak ada scroll, gak ada itung-itungan tinggi px, gak mungkin ada sliver
// nongol lagi. Deterministik: 8 kartu, titik.

"use client";

import { useState } from "react";
import Image from "next/image";
import { fmtNum } from "./dashboard-data";
import { LiveData, LivePost } from "./live-data";
import { PlatformFilter } from "./platform-filter-dropdown";

const TOP_POSTS_MOCK = [
  { id: "m1", title: "Judul konten nya", type: "Tiktok", likes: "4.5k", comments: "320", score: "9.2" },
  { id: "m2", title: "Judul konten nya", type: "Youtube", likes: "4.5k", comments: "320", score: "7.5" },
];

// Kartu pengisi (dummy) — dipakai buat nambahin total tampilan sampai 12 kartu
// kalau data live asli belum cukup. Kontennya sama seperti di
// docs/top-posts-cards-preview.html (kartu 5–12) biar visualnya konsisten.
const FILLER_POSTS: {
  title: string;
  likes: number;
  comments: number;
  score: string;
  platform: "tiktok" | "youtube";
}[] = [
  { title: "Speaker Bluetooth Jumbo — Bass Nendang Buat Ngampus! 🔊", likes: 87, comments: 12, score: "125.0", platform: "tiktok" },
  { title: "3 Settingan Kamera HP Biar Konten Makin Cinematik 🎥", likes: 56, comments: 9, score: "86.0", platform: "youtube" },
  { title: "Q20 AirMax — Swipe & Like Langsung dari Casing", likes: 45, comments: 8, score: "65.0", platform: "tiktok" },
  { title: "Review TWS Gaming di Bawah 500rb — Worth It? 🎧", likes: 34, comments: 5, score: "47.0", platform: "youtube" },
  { title: "Unboxing EarPods Mewah — Kualitas Jagoan? 🔥", likes: 29, comments: 6, score: "44.0", platform: "tiktok" },
  { title: "5 Tips Biar Konten TikTok Cepat Viral di App!", likes: 18, comments: 3, score: "27.0", platform: "youtube" },
  { title: "Cara Bikin Musik Latar Sendiri — GRATIS! 🎼", likes: 15, comments: 4, score: "22.0", platform: "tiktok" },
  { title: "Behind the scenes: rekam vlog kolab sama komunitas dev", likes: 2, comments: 0, score: "8.0", platform: "youtube" },
];

const TOTAL_CARDS = 12;
const COLLAPSED_CARDS = 8; // jumlah kartu yang tampil sebelum klik "Lihat Semua"

// Gradient thumbnail fallback kalau post gak punya gambar (rotasi per index)
const THUMB_FALLBACK = [
  { bg: "linear-gradient(135deg,#3b2a5e,#1a1330)", emoji: "🎧" },
  { bg: "linear-gradient(135deg,#123a4e,#0d1f2c)", emoji: "📱" },
  { bg: "linear-gradient(135deg,#4e2312,#2a130d)", emoji: "🏃" },
  { bg: "linear-gradient(135deg,#24344e,#101827)", emoji: "🎬" },
  { bg: "linear-gradient(135deg,#314f3f,#1a2a26)", emoji: "🔊" },
  { bg: "linear-gradient(135deg,#2a2e4e,#1a1b2e)", emoji: "📷" },
  { bg: "linear-gradient(135deg,#5e4a2e,#3d2e1a)", emoji: "🎧" },
  { bg: "linear-gradient(135deg,#122f27,#0d1a1f)", emoji: "🎮" },
  { bg: "linear-gradient(135deg,#4a1f3d,#2d1226)", emoji: "🔥" },
  { bg: "linear-gradient(135deg,#2f3d12,#1a260d)", emoji: "📈" },
  { bg: "linear-gradient(135deg,#3a2f4a,#231c30)", emoji: "🎼" },
  { bg: "linear-gradient(135deg,#4a1f1f,#2e0d12)", emoji: "🎥" },
];

function scoreFor(post: { likeCount: number; commentCount: number; shareCount: number }) {
  // Skor engagement sederhana: like + 2*comment + 3*share
  return (post.likeCount + 2 * post.commentCount + 3 * post.shareCount).toFixed(1);
}

function platformChipStyle(platform?: string): { label: string; icon?: string; color: string } | null {
  const p = (platform ?? "").toLowerCase();
  if (p === "youtube") return { label: "YouTube", icon: "/icons/youtube.png", color: "#EF4444" };
  if (p === "tiktok") return { label: "TikTok", icon: "/icons/tiktok.png", color: "#8B5CF6" };
  if (!platform) return null;
  return { label: platform, color: "rgba(255,255,255,0.7)" };
}
export function TopPostsTable({
  live,
  platformFilter = "all",
}: {
  live?: LiveData;
  platformFilter?: PlatformFilter;
}) {
  const [showAll, setShowAll] = useState(false);

  const livePosts = (live?.posts ?? [])
    .slice()
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, TOTAL_CARDS);

  const hasLive = !!live && !live.loading && livePosts.length > 0;
  // Post asli (live) selalu di depan; sisanya diisi filler dummy sampai total 12,
  // supaya grid selalu penuh 3 baris walau data live yang tersedia sedikit.
  // FILLER ikut difilter platform juga — biar gak nyampur pas pilih TikTok/YouTube.
  const fillerPool =
    platformFilter === "all"
      ? FILLER_POSTS
      : FILLER_POSTS.filter((f) => f.platform === platformFilter);
  const fillerCount = Math.max(0, TOTAL_CARDS - livePosts.length);
  const fillerPosts = fillerPool.slice(0, fillerCount);

  const visibleLiveCount = showAll ? livePosts.length : Math.min(livePosts.length, COLLAPSED_CARDS);
  const visibleFillerCount = showAll
    ? fillerPosts.length
    : Math.max(0, COLLAPSED_CARDS - visibleLiveCount);

  const visibleLivePosts = livePosts.slice(0, visibleLiveCount);
  const visibleFillerPosts = fillerPosts.slice(0, visibleFillerCount);

  return (
    <div className="rounded-[10px] bg-[#1C222B] p-4">
      {/* Style lokal — hover kartu & konsistensi visual dgn preview */}
      <style jsx>{`
        .post-card {
          display: block;
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          background: #171c24;
          border: 1px solid transparent;
          transition: transform 0.2s, border-color 0.2s;
          text-decoration: none;
        }
        .post-card:hover {
          transform: translateY(-3px);
          border-color: #4c00b2;
        }
        .platform-chip {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 3px 7px;
          border-radius: 5px;
          background: rgba(14, 17, 22, 0.85);
          font-size: 9px;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
        }
        .toggle-btn {
          cursor: pointer;
          background: transparent;
          border: 1px solid #2e3750;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          padding: 7px 16px;
          border-radius: 8px;
          transition: background-color 0.2s, color 0.2s, border-color 0.2s;
        }
        .toggle-btn:hover {
          background: #232a3d;
          color: #fff;
          border-color: #3b4663;
        }
      `}</style>

      {/* Header — marginBottom eksplisit biar jarak ke grid kartu gak mepet */}
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h2 className="text-[24px] font-bold text-white">Top Performing Posts</h2>
        {hasLive && (
          <span className="rounded-full bg-[#F97316]/15 px-2.5 py-1 text-[10px] font-bold text-[#F97316]">
            ● LIVE — {platformFilter === "all" ? "Semua Platform" : platformFilter === "tiktok" ? "TikTok" : "YouTube"}{" "}
            {(platformFilter === "all" ? live.accounts[0] : live.accounts.find((a) => a.platform === platformFilter))
              ? `@${(platformFilter === "all" ? live.accounts[0] : live.accounts.find((a) => a.platform === platformFilter))!.username}`
              : ""}
          </span>
        )}
      </div>

      {/* Grid kartu post — TIDAK pakai scroll sama sekali. Kartu di luar batas
          collapsed BENERAN gak dirender ke DOM, jadi gak mungkin ada sliver
          atau kepotong setengah, deterministik. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {hasLive
          ? [
              // 1) Post asli dari API — selalu tampil di urutan paling atas
              ...visibleLivePosts.map((post: LivePost, i) => {
                const fb = THUMB_FALLBACK[i % THUMB_FALLBACK.length];
                const chip = platformChipStyle(post.platform);
                return (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="post-card"
                  >
                    <div style={{ position: "relative", height: 100, background: post.picture ? "#10141b" : fb.bg }}>
                      {post.picture ? (
                        <Image
                          src={post.picture}
                          alt=""
                          fill
                          sizes="270px"
                          style={{ objectFit: "cover" }}
                          unoptimized
                          loading="eager"
                        />
                      ) : (
                        <span style={{ fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                          {fb.emoji}
                        </span>
                      )}
                      {chip && (
                      <div className="platform-chip" style={{ color: chip.color }}>
                          {chip.icon ? (
                            <img src={chip.icon} alt={chip.label} title={chip.label} style={{ width: 14, height: 14 }} />
                          ) : (
                            <span>{chip.label}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "10px 12px 12px" }}>
                      <p
                        style={{
                          fontSize: 11,
                          lineHeight: 1.45,
                          minHeight: 32,
                          fontWeight: 600,
                          color: "#E2E8F0",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          margin: 0,
                        }}
                      >
                        {post.message || "Tanpa caption"}
                      </p>

                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>
                          <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                          {fmtNum(post.likeCount ?? 0)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>
                          <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                          {fmtNum(post.commentCount ?? 0)}
                        </span>
                        <span
                          style={{
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            fontWeight: "bold",
                            color: "#22C55E",
                            background: "rgba(34,197,94,0.12)",
                            padding: "3px 8px",
                            borderRadius: 5,
                          }}
                        >
                          <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {scoreFor(post)}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              }),
              // 2) Sisanya diisi kartu filler (dummy) sampai batas yang lagi tampil
              ...visibleFillerPosts.map((post, fi) => {
                const globalIndex = livePosts.length + fi;
                const fb = THUMB_FALLBACK[globalIndex % THUMB_FALLBACK.length];
                const chip = platformChipStyle(post.platform);
                return (
                  <div key={`filler-${fi}`} className="post-card" data-cursor="hover" style={{ cursor: "default" }}>
                    <div style={{ position: "relative", height: 100, background: fb.bg }}>
                      <span style={{ fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        {fb.emoji}
                      </span>
                      {chip && (
                      <div className="platform-chip" style={{ color: chip.color }}>
                          {chip.icon ? (
                            <img src={chip.icon} alt={chip.label} title={chip.label} style={{ width: 14, height: 14 }} />
                          ) : (
                            <span>{chip.label}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "10px 12px 12px" }}>
                      <p
                        style={{
                          fontSize: 11,
                          lineHeight: 1.45,
                          minHeight: 32,
                          fontWeight: 600,
                          color: "#E2E8F0",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          margin: 0,
                        }}
                      >
                        {post.title}
                      </p>
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>
                          ❤ {post.likes}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>
                          💬 {post.comments}
                        </span>
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 10,
                            fontWeight: "bold",
                            color: "#22C55E",
                            background: "rgba(34,197,94,0.12)",
                            padding: "3px 8px",
                            borderRadius: 5,
                          }}
                        >
                          ⭐ {post.score}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }),
            ]
          : TOP_POSTS_MOCK.map((row, i) => {
              const fb = THUMB_FALLBACK[i % THUMB_FALLBACK.length];
              const chip = platformChipStyle(row.type);
              return (
                <div key={row.id} className="post-card" data-cursor="hover" style={{ cursor: "default" }}>
                  <div style={{ position: "relative", height: 100, background: fb.bg }}>
                    <span style={{ fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      {fb.emoji}
                    </span>
                    {chip && (
                    <div className="platform-chip" style={{ color: chip.color }}>
                        {chip.icon ? (
                          <img src={chip.icon} alt={chip.label} title={chip.label} style={{ width: 14, height: 14 }} />
                        ) : (
                          <span>{chip.label}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "10px 12px 12px" }}>
                    <p
                      style={{
                        fontSize: 11,
                        lineHeight: 1.45,
                        minHeight: 32,
                        fontWeight: 600,
                        color: "#E2E8F0",
                        margin: 0,
                      }}
                    >
                      {row.title}
                    </p>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>❤ {row.likes}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#94A3B8" }}>💬 {row.comments}</span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 10,
                          fontWeight: "bold",
                          color: "#22C55E",
                          background: "rgba(34,197,94,0.12)",
                          padding: "3px 8px",
                          borderRadius: 5,
                        }}
                      >
                        ⭐ {row.score}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Tombol toggle — cuma muncul kalau memang ada lebih dari 8 kartu total */}
      {hasLive && TOTAL_CARDS > COLLAPSED_CARDS && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button type="button" className="toggle-btn" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Lihat Lebih Sedikit ▲" : `Lihat ${TOTAL_CARDS - COLLAPSED_CARDS} Lainnya ▼`}
          </button>
        </div>
      )}
    </div>
  );
}

export default TopPostsTable;