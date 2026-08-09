// profile-card.tsx — kartu profil dinamis per platform + tombol View Profile.
// Pemecahan dari main-content.tsx (PR 1) — tampilan IDENTIK dengan sebelumnya.

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { DayRange, RANGE_FACTOR, parseNum, fmtNum } from "./dashboard-data";
import { LiveData } from "./live-data";

const MINI_STATS = [
  { label: "Chat", value: "150" },
  { label: "Shared", value: "2.4 K" },
  { label: "Posts", value: "200" },
];

// Profil dinamis per platform — foto, handle, bio & stat
export const PROFILE_META: Record<
  string,
  {
    handle: string;
    bio: string;
    iconKey: string;
    hex: string;
    stats: { label: string; value: string }[];
  }
> = {
  TikTok: {
    handle: "@bangbay_tiktok",
    bio: "TikTok Content Creator",
    iconKey: "tiktok",
    hex: "#00F2EA",
    stats: [
      { label: "Followers", value: "850K" },
      { label: "Following", value: "1.2K" },
      { label: "Likes", value: "3.2M" },
    ],
  },
  YouTube: {
    handle: "@bangbay_youtube",
    bio: "YouTube Content Creator",
    iconKey: "youtube",
    hex: "#FF0000",
    stats: [
      { label: "Subscribers", value: "320K" },
      { label: "Videos", value: "45" },
      { label: "Views", value: "8.4M" },
    ],
  },
  Instagram: {
    handle: "@bangbay_ig",
    bio: "Instagram Creator",
    iconKey: "instagram",
    hex: "#E1306C",
    stats: [
      { label: "Followers", value: "75K" },
      { label: "Following", value: "890" },
      { label: "Posts", value: "210" },
    ],
  },
  WhatsApp: {
    handle: "@bangbay_wa",
    bio: "WhatsApp Channel",
    iconKey: "whatsapp",
    hex: "#25D366",
    stats: [
      { label: "Followers", value: "12K" },
      { label: "Channels", value: "3" },
      { label: "Broadcasts", value: "28" },
    ],
  },
};

const PROFILE_ROUTE = "/platform/profile";

export function ProfileCard({
  platform,
  days,
  live,
}: {
  platform: string;
  days: DayRange;
  live?: LiveData;
}) {
  const router = useRouter();
  const meta = platform && PROFILE_META[platform] ? PROFILE_META[platform] : null;

  // ---- Data asli Zernio (kalau ada) ----
  // FIXED: ketika platform kosong (mode "Semua Sosmed"), JANGAN pakai akun pertama.
  // Dulu find() langsung ambil TikTok → profil langsung "arah ke TikTok".
  // Sekarang: hanya pilih liveAcct saat platform spesifik dipilih.
  const matchedAccounts = live?.accounts?.filter(
    (a) => !platform || a.platform === platform.toLowerCase()
  ) ?? [];
  const liveAcct =
    platform && matchedAccounts.length > 0 ? matchedAccounts[0] : null;
  const livePosts = (live?.posts ?? []).filter(
    (p) => !platform || p.platform === platform.toLowerCase()
  );
  const hasLive = matchedAccounts.length > 0;
  // Mode "Semua Sosmed": gabungkan stat semua akun
  const totalFollowers = matchedAccounts.reduce((s, a) => s + (a.followersCount ?? 0), 0);
  const totalVideos = livePosts.length;
  const totalEngagement = livePosts.reduce((s, p) => s + (p.likeCount ?? 0), 0);

  const firstAcct = matchedAccounts[0];
  const handle = hasLive && liveAcct
    ? `@${liveAcct.username}`
    : platform
      ? (PROFILE_META[platform]?.handle ?? "@username")
      : firstAcct
        ? `@${firstAcct.username}`
        : "@bangbay_audio";
  const bio = hasLive && liveAcct
    ? liveAcct.bio || liveAcct.displayName || "Content Creator"
    : platform
      ? (PROFILE_META[platform]?.bio ?? "Content Creator | Digital Marketer")
      : "BangBay · Multi-Platform Creator";
  const avatarSrc = hasLive && liveAcct?.profilePicture
    ? liveAcct.profilePicture
    : "/images/Contoh-PP-Profile.jpg";

  // Stat: asli kalau ada, else mock diskalakan range
  const stats = hasLive
    ? platform && liveAcct
      ? // Mode platform tunggal: pakai data akun itu
        [
          {
            label: liveAcct.platform === "youtube" ? "Subscribers" : "Followers",
            value: fmtNum(Math.max(liveAcct.followersCount ?? 0, 1)),
          },
          ...(liveAcct.platform === "youtube"
            ? [
                { label: "Videos", value: fmtNum(livePosts.length || (liveAcct.videoCount ?? 0)) },
                { label: "Views", value: fmtNum(livePosts.reduce((s, p) => s + (p.likeCount ?? 0), 0)) },
              ]
            : [
                { label: "Following", value: fmtNum(liveAcct.followingCount ?? 0) },
                { label: "Likes", value: fmtNum(liveAcct.likesCount ?? 0) },
              ]),
        ]
      : // FIXED: Mode "Semua Sosmed" → agregat semua akun (bukan akun pertama)
        [
          { label: "Total Followers", value: fmtNum(Math.max(totalFollowers, 1)) },
          { label: "Total Videos", value: fmtNum(totalVideos || matchedAccounts.length) },
          { label: "Total Engagement", value: fmtNum(totalEngagement) },
        ]
    : (meta ? meta.stats : MINI_STATS).map((s) => ({
        ...s,
        value: fmtNum(Math.max(Math.round(parseNum(s.value) * RANGE_FACTOR[days]), 1)),
      }));

  // View Profile → ke halaman profil asli platform
  const handleViewProfile = () => {
    if (platform && liveAcct?.profileUrl) {
      window.open(liveAcct.profileUrl, "_blank");
      return;
    }
    router.push(PROFILE_ROUTE);
  };

  return (
    <div className="rounded-[10px] bg-[#1C222B] p-2">
      <div className="flex gap-3">
        {/* Foto profil — asli dari Zernio (kalau ada) */}
        <Image
          src={avatarSrc}
          alt="Foto profil"
          width={108}
          height={143}
          className="h-[143px] w-[108px] shrink-0 rounded-[10px] object-cover"
          unoptimized={avatarSrc.startsWith("http")}
        />
        {/* Nama & deskripsi */}
        <div className="flex min-w-0 flex-1 flex-col pt-1">
          <p className="text-[13px] font-bold text-white">{handle}</p>
          <p className="mt-1 line-clamp-4 text-[13px] font-bold text-white/80">{bio}</p>
        </div>
      </div>

      {/* Mini stat: dinamis sesuai platform — pendek & senada dark theme */}
      <div className="mt-2 grid grid-cols-3 gap-[6px]">
        {stats.map((m) => (
          <div
            key={m.label}
            className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[8px] bg-[#232A3D] px-1 py-2"
          >
            <span className="text-[15px] font-bold leading-tight text-white">{m.value}</span>
            <span className="text-[10px] font-semibold leading-tight text-[#94A3B8]">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Tombol View Profile — full-width di bawah stat, CTA utama kartu */}
      <div className="mt-2">
        <button
          type="button"
          onClick={handleViewProfile}
          title="Buka halaman Profile — belum tersedia"
          className="w-full cursor-pointer rounded-[8px] bg-[#251018] px-2.5 py-2 text-center transition-opacity hover:opacity-80"
        >
          <span className="text-[11px] font-bold text-white">View Profile</span>
        </button>
      </div>
    </div>
  );
}

export default ProfileCard;
