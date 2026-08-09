/**
 * cn() — helper untuk menggabungkan class CSS secara kondisional.
 * Versi ringan tanpa dependency eksternal (cukup untuk sekarang).
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
