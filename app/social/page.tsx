// app/social/page.tsx — Halaman Social Accounts (dari preview-social.html)
// Data dari useLiveData() + useInbox() — real-time dari Zernio.
// Icon asli dari /public/icons/.

"use client";

import { useLiveData } from "@/components/dashboard/live-data";
import { useInbox } from "@/components/dashboard/inbox-data";
import { useEffect, useState } from "react";
import Image from "next/image";

// Warna platform konsisten
const PLATFORM_COLOR: Record<string, string> = {
  tiktok: "#8B5CF6",
  youtube: "#EF4444",
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  linkedin: "#0A66C2",
  threads: "#000000",
};

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  twitter: "X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads",
};

function IconForPlatform({ platform }: { platform: string }) {
  const iconMap: Record<string, string> = {
    tiktok: "/icons/tiktok.png",
    youtube: "/icons/youtube.png",
    instagram: "/icons/instagram.png",
    twitter: "/icons/x.png",
    facebook: "/icons/facebook.png",
    linkedin: "/icons/linkedin.png",
    threads: "/icons/threads.png",
  };
  const src = iconMap[platform];
  if (!src) return <span style={{fontSize:18}}>＋</span>;
  return <Image src={src} alt={PLATFORM_LABEL[platform]} width={32} height={32} style={{borderRadius:8}} />;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatActivityRate(posts: number, days: number) {
  return `${posts} konten / ${days} hari`;
}

export default function SocialPage() {
  const { accounts, posts, loading, error, reload } = useLiveData();
  const { items: inboxItems } = useInbox();

  // State Sync: platform yang sedang sync + pesan sukses/gagal
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<{ platform: string; ok: boolean; text: string } | null>(null);
  // Modal hubungkan akun
  const [connectOpen, setConnectOpen] = useState(false);

  // Data untuk jadwal (mock sementara — nanti dari API scheduling)
  const [schedule, setSchedule] = useState<Array<{
    id: string;
    title: string;
    platform: string;
    thumbnail: string;
    time: string;
  }>>([
    { id: "s1", title: "Review Speaker Jumbo 🔊", platform: "tiktok", thumbnail: "", time: "Besok 09:00 WIB" },
    { id: "s2", title: "Settingan Kamera HP Part 3", platform: "tiktok", thumbnail: "", time: "Kamis 14:30 WIB" },
    { id: "s3", title: "Unboxing TWS Gaming Murah", platform: "youtube", thumbnail: "", time: "Sabtu 11:00 WIB" },
  ]);

  if (loading) {
    return (
      <div style={{ padding: "40px 32px", color: "#fff" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className="spinner" style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #4c00b2", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <span>Memuat akun sosmed...</span>
        </div>
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 32px", color: "#EF4444" }}>
        Gagal memuat data: {error}
        <button onClick={() => window.location.reload()} style={{ marginLeft: 12, padding: "6px 12px", background: "#4c00b2", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>Coba Lagi</button>
      </div>
    );
  }

  // Hitung statistik per platform
  const statsByPlatform = accounts.map((acc) => {
    const accPosts = posts.filter((p) => p.platform === acc.platform);
            const totalLikes = accPosts.reduce((s, p) => s + (p.likeCount ?? 0), 0);
            const totalViews = accPosts.reduce((s, p) => s + (p.shareCount ?? 0), 0);
    const posts30d = accPosts.filter((p) => {
      if (!p.createdTime) return false;
      return Date.now() - new Date(p.createdTime).getTime() < 30 * 86_400_000;
    }).length;
    return {
      platform: acc.platform,
      label: PLATFORM_LABEL[acc.platform] ?? acc.platform,
      username: acc.username,
      displayName: acc.displayName ?? acc.username,
      avatar: acc.profilePicture,
      followers: acc.followersCount ?? 0,
      likes: totalLikes,
      views: totalViews,
      posts: accPosts.length,
      posts30d,
    };
  });

  // Total konten gabungan
  const totalPosts = posts.length;
  const totalTikTok = posts.filter((p) => p.platform === "tiktok").length;
  const totalYouTube = posts.filter((p) => p.platform === "youtube").length;

  /** Tombol Sync: refetch data Zernio + feedback */
  async function handleSync(platform: string) {
    if (syncingPlatform) return;
    setSyncingPlatform(platform);
    setSyncMsg(null);
    try {
      await reload();
      setSyncMsg({ platform, ok: true, text: "✓ Data disinkronkan" });
    } catch {
      setSyncMsg({ platform, ok: false, text: "✗ Gagal sinkron" });
    } finally {
      setSyncingPlatform(null);
      setTimeout(() => setSyncMsg(null), 3000);
    }
  }

  return (
    <div style={{ background: "#12161F", minHeight: "100vh", color: "#fff", padding: "28px 32px" }}>
      <style jsx>{`
        .spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Social Accounts</h1>
          <p style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
            Kelola & pantau semua akun sosmed terhubung &middot; {statsByPlatform.length} akun aktif
          </p>
        </div>
        <button onClick={() => setConnectOpen(true)} style={{ padding: "9px 18px", fontSize: 11, fontWeight: 600, borderRadius: 7, background: "#4c00b2", color: "#fff", border: "none", cursor: "pointer" }}>
          ＋ Hubungkan Akun
        </button>
      </div>

      {/* GRID AKUN */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {statsByPlatform.map((acc) => (
          <div
            key={acc.platform}
            style={{
              background: "#1C222B",
              borderRadius: 8,
              padding: 16,
              border: "1px solid transparent",
              transition: "border-color .15s, transform .15s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2E3750")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0, background: `${PLATFORM_COLOR[acc.platform] || "#4c00b2"}15` }}>
                <IconForPlatform platform={acc.platform} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{acc.displayName}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>@{acc.username}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 8.5, fontWeight: 700, letterSpacing: ".5px", color: "#22C55E", background: "rgba(34,197,94,.12)", padding: "3px 7px", borderRadius: 999 }}>
                ● LIVE
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "#161B24", borderRadius: 6, padding: "9px 10px" }}>
                <div style={{ fontSize: 8.5, letterSpacing: ".8px", color: "#64748B", fontWeight: 600 }}>
                  {acc.platform === "youtube" ? "SUBSCRIBERS" : "FOLLOWERS"}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{fmtNum(acc.followers)}</div>
              </div>
              <div style={{ background: "#161B24", borderRadius: 6, padding: "9px 10px" }}>
                <div style={{ fontSize: 8.5, letterSpacing: ".8px", color: "#64748B", fontWeight: 600 }}>
                  {acc.platform === "youtube" ? "VIEWS" : "LIKES"}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{fmtNum(acc.likes || acc.views)}</div>
              </div>
              <div style={{ background: "#161B24", borderRadius: 6, padding: "9px 10px" }}>
                <div style={{ fontSize: 8.5, letterSpacing: ".8px", color: "#64748B", fontWeight: 600 }}>POSTS</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{acc.posts}</div>
              </div>
            </div>

            <div style={{ marginBottom: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "#94A3B8", marginBottom: 4 }}>
                <span>Aktivitas posting 30 hari</span>
                <span>{formatActivityRate(acc.posts30d, 30)}</span>
              </div>
              <div style={{ height: 4, background: "#161B24", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, background: PLATFORM_COLOR[acc.platform] || "#4c00b2", width: `${Math.min(acc.posts30d * 8, 100)}%` }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
              <a
                href={`/?platform=${acc.platform}`}
                style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 600, padding: "7px 0", borderRadius: 6, textDecoration: "none", background: "#4c00b2", color: "#fff" }}
              >
                Detail Analytics
              </a>
              <button
                onClick={() => handleSync(acc.platform)}
                disabled={syncingPlatform === acc.platform}
                style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 600, padding: "7px 0", borderRadius: 6, cursor: syncingPlatform === acc.platform ? "wait" : "pointer", border: "none", background: "#232A3D", color: "#94A3B8" }}
              >
                {syncingPlatform === acc.platform ? "Sync…" : "Sync"}
              </button>
            </div>
            {syncMsg && syncMsg.platform === acc.platform && (
              <div style={{ marginTop: 8, fontSize: 10.5, color: syncMsg.ok ? "#22C55E" : "#EF4444", textAlign: "center" }}>
                {syncMsg.text}
              </div>
            )}
          </div>
        ))}

        {/* SLOT KOSONG */}
        <div style={{
          background: "#1C222B",
          borderRadius: 8,
          border: "1.5px dashed #2E3750",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 190,
          padding: 24,
          cursor: "pointer",
        }}
        onClick={() => setConnectOpen(true)}>
          <div style={{ fontSize: 26 }}>＋</div>
          <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#94A3B8" }}>Hubungkan platform lain</div>
          <div style={{ fontSize: "10px", color: "#64748B", textAlign: "center", lineHeight: 1.5 }}>
            Instagram, X, Facebook, Threads<br />dll — via Zernio
          </div>
        </div>
      </div>

      {/* BARIS BAWAH: Jadwal + Distribusi */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginTop: 14 }}>
        {/* Panel kiri: Jadwal */}
        <div style={{ background: "#1C222B", borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Jadwal Posting Berikutnya</h3>
          {schedule.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i > 0 ? "1px solid #232A3D" : "none" }}>
              <div style={{ width: 52, height: 32, borderRadius: 5, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, background: `linear-gradient(135deg, ${PLATFORM_COLOR[s.platform] || "#4c00b2"}aa, ${PLATFORM_COLOR[s.platform] || "#4c00b2"}33)` }}>
                <IconForPlatform platform={s.platform} />
              </div>
              <div>
                <div style={{ fontSize: "11.5px", fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: "9.5px", color: "#64748B", marginTop: 2 }}>{PLATFORM_LABEL[s.platform]}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right", fontSize: "9.5px", color: "#94A3B8", whiteSpace: "pre-line" }}>
                {s.time}
              </div>
            </div>
          ))}
        </div>

        {/* Panel kanan: Donut distribusi */}
        <div style={{ background: "#1C222B", borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Distribusi Konten</h3>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{totalPosts}</div>
            <div style={{ fontSize: "9.5px", color: "#64748B", letterSpacing: ".8px" }}>TOTAL KONTEN</div>
          </div>
          {totalPosts > 0 ? (
          <svg width="120" height="120" viewBox="0 0 42 42" style={{ display: "block", margin: "0 auto 12px" }}>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="#161B24" strokeWidth="5" />
            {totalTikTok > 0 && (
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#8B5CF6" strokeWidth="5"
                strokeDasharray={`${(totalTikTok / totalPosts) * 100} ${100 - (totalTikTok / totalPosts) * 100}`}
                strokeDashoffset="25" strokeLinecap="butt" />
            )}
            {totalYouTube > 0 && (
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EF4444" strokeWidth="5"
                strokeDasharray={`${(totalYouTube / totalPosts) * 100} ${100 - (totalYouTube / totalPosts) * 100}`}
                strokeDashoffset="-72" strokeLinecap="butt" />
            )}
          </svg>
          ) : (
            <div style={{ padding: "24px 0 12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#64748B" }}>Belum ada konten — donut muncul otomatis saat ada data.</div>
            </div>
          )}
          {totalTikTok > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "10.5px", color: "#94A3B8", padding: "4px 0" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8B5CF6", display: "inline-block" }}></span>
              TikTok <span style={{ marginLeft: "auto", color: "#fff", fontWeight: 600 }}>{totalTikTok}</span>
            </div>
          )}
          {totalYouTube > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "10.5px", color: "#94A3B8", padding: "4px 0" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block" }}></span>
              YouTube <span style={{ marginLeft: "auto", color: "#fff", fontWeight: 600 }}>{totalYouTube}</span>
            </div>
          )}
        </div>
      </div>

      <p style={{ marginTop: 18, fontSize: 11, color: "#64748B", textAlign: "center" }}>
        Data dari Zernio API · Icon dari public/icons/ · Halaman ini dibangun dari preview-social.html
      </p>

      {/* MODAL Hubungkan Akun */}
      {connectOpen && (
        <>
          <div
            onClick={() => setConnectOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 40 }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "#1C222B", border: "1px solid #2E3750", borderRadius: 14,
            padding: 22, width: 340, zIndex: 41, color: "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Hubungkan Akun</h3>
              <button onClick={() => setConnectOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 16, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.5, marginBottom: 12 }}>
              Platform berikut bisa dihubungkan via Zernio. Tersedia dalam pengembangan — segera hadir.
            </div>
            {["Instagram", "X (Twitter)", "Facebook", "Threads", "LinkedIn"].map((p) => (
              <button
                key={p}
                disabled
                style={{
                  width: "100%", textAlign: "left", fontSize: 12, fontWeight: 600,
                  padding: "10px 12px", borderRadius: 8, border: "1px solid #2E3750",
                  background: "#0E1116", color: "#64748B", marginBottom: 7, cursor: "not-allowed",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                {p}
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".5px", color: "#F97316", background: "rgba(249,115,22,.12)", padding: "3px 7px", borderRadius: 99 }}>
                  SEGERA
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}