// metric-detail-types.ts — tipe & metadata yang dipakai sama server page + komponen client.
// Di-extract supaya server page (async) & komponen (metric-detail.tsx) bisa import
// sama persis tanpa circular dependency.

export type DetailType = "followers" | "likes" | "comments" | "performance" | "engagement";

export const META: Record<DetailType, { title: string; desc: string; gradient: [string, string] }> = {
  followers: {
    title: "Followers",
    desc: "Total pengikut tiap akun yang terhubung ke SmartDash. Sumber: Zernio (data asli akun kamu).",
    gradient: ["#1E3A8A", "#3B82F6"],
  },
  likes: {
    title: "Likes",
    desc: "Total likes dari semua postingan akun terhubung. Sumber: Zernio (data asli).",
    gradient: ["#7C2D12", "#F97316"],
  },
  comments: {
    title: "Comments",
    desc: "Total komentar dari semua postingan akun terhubung. Sumber: Zernio (data asli).",
    gradient: ["#134E4A", "#2DD4BF"],
  },
  performance: {
    title: "Content Performance",
    desc: "Perbandingan performa konten antar platform per periode — dari data postingan asli.",
    gradient: ["#312E81", "#6366F1"],
  },
  engagement: {
    title: "Engagement Metrics",
    desc: "Tren likes & komentar dari postingan asli dari waktu ke waktu.",
    gradient: ["#312E81", "#8B5CF6"],
  },
};
