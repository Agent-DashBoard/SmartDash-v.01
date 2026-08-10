// ============================================================================
// dashboard-data.ts — data, tipe & helper BERSAMA untuk komponen dashboard.
// Dipakai oleh: stat-card, engagement-metrics, content-performance,
// profile-card, dan main-content (perakit).
// ----------------------------------------------------------------------------
// CATATAN: file ini hanya hasil PEMECAHAN dari main-content.tsx (PR 1).
// Tidak ada perubahan nilai/desain — semua konstanta identik dengan sebelumnya.
// ============================================================================

// Daftar platform untuk dropdown filter
export const PLATFORMS = ["TikTok", "YouTube", "Instagram", "WhatsApp"];

// Range waktu filter Days — tombol segmented (Today / Last 7 days / Last 30 days)
export const DAY_RANGES = ["Today", "Last 7 days", "Last 30 days"] as const;
export type DayRange = (typeof DAY_RANGES)[number];

// Mapping range → jumlah data terakhir yang ditampilkan
// (Engagement pakai 12 bulan; Content Performance cuma 8 minggu → slice tetap ambil semua)
export const RANGE_WINDOW: Record<DayRange, number> = {
  Today: 1, // titik terakhir (representasi hari ini)
  "Last 7 days": 2, // 2 titik terakhir
  "Last 30 days": 12, // semua (12 bulan / 8 minggu)
};

// Jumlah HARI yang di-filter untuk data asli (bukan mock).
// Dipakai chart Content Performance & Engagement — "Last 30 days" = hanya posts
// 30 hari terakhir (bukan semua posts sejak dulu kala).
export const RANGE_DAYS: Record<DayRange, number> = {
  Today: 1,
  "Last 7 days": 7,
  "Last 30 days": 30,
};

// Faktor skala aktivitas per range (buat kartu metric & stat profil — makin panjang range makin akumulasi)
export const RANGE_FACTOR: Record<DayRange, number> = {
  Today: 0.15,
  "Last 7 days": 0.6,
  "Last 30 days": 1,
};

// Faktor skala delta pertumbuhan per range
export const RANGE_DELTA_FACTOR: Record<DayRange, number> = {
  Today: 0.35,
  "Last 7 days": 0.7,
  "Last 30 days": 1,
};

// Label deskriptif per range (dipakai di sub-judul chart)
export const RANGE_LABEL: Record<DayRange, string> = {
  Today: "hari ini",
  "Last 7 days": "7 hari terakhir",
  "Last 30 days": "30 hari terakhir",
};

// Warna resmi tiap platform (legend chart + aksen badge)
// ============================================================================
// WARNA PLATFORM — SATU SUMBER KEBENARAN (single source of truth)
// Dipakai oleh: content-performance (bar), engagement-metrics (badge/icon),
// profile-card (PROFILE_META.hex), stat-card (METRIC_DATA.hex).
// Kalau mau ganti warna brand, cukup ubah di sini — semua halaman ikut.
// ============================================================================
export const PLATFORM_COLORS: Record<string, string> = {
  TikTok: "#00F2EA",
  YouTube: "#FF0000",
  Instagram: "#E1306C",
  WhatsApp: "#25D366",
};

// Alias lama — tetap diekspor agar kode yang sudah ada tidak perlu diubah
export const CONTENT_PLATFORM_COLORS: Record<string, string> = PLATFORM_COLORS;

// Parse "850.0K" / "3.2M" → angka
export function parseNum(v: string): number {
  const m = v.match(/([\d.]+)([KM])?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2] === "M" ? n * 1_000_000 : m[2] === "K" ? n * 1000 : n;
}

// Format angka → "850.0K" / "3.2M" / "180"
export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}
