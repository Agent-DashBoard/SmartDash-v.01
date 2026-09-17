// inbox-data.ts — SATU SUMBER DATA untuk unified inbox (komunikasi MASUK saja:
// email + DM/komentar/mention sosmed). Meeting, note, reminder = aktivitas
// pribadi → BUKAN bagian inbox (itu domain Activity Feed).
// Nanti kalau API asli siap (Gmail via IMAP, komentar sosmed via Zernio),
// tinggal tambahkan fetcher di sini — komponen gak perlu diubah.

"use client";

import { useCallback, useMemo, useState } from "react";

export type InboxSource = "email" | "tiktok" | "youtube" | "instagram" | "twitter";

export type InboxItem = {
  id: string;
  source: InboxSource;
  /** Nama pengirim / aktor */
  actor: string;
  /** Judul singkat, misal: "mengirim email", "komentar di TikTok" */
  verb: string;
  desc: string;
  /** ISO timestamp — komponen yang format ke "x menit lalu" */
  createdAt: string;
  action: string;
  unread: boolean;
};

// Warna avatar per sumber — konsisten dengan tone Activity Feed lama
export const SOURCE_META: Record<InboxSource, { icon: string; label: string }> = {
  email: { icon: "/icons/gmail.png", label: "Email" },
  tiktok: { icon: "/icons/tiktok.png", label: "TikTok" },
  youtube: { icon: "/icons/youtube.png", label: "YouTube" },
  instagram: { icon: "/icons/instagram.png", label: "Instagram" },
  twitter: { icon: "/icons/x.png", label: "X" },
};

// ⚠️ SEMENTARA: data contoh terstruktur — diganti fetcher asli saat API siap.
// Timestamp relatif dari "sekarang" biar filter Today selalu valid.
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const MOCK_INBOX: InboxItem[] = [
  { id: "in1", source: "email", actor: "Budi Santoso", verb: "mengirim email", desc: "Proposal kerjasama Q3 - Tolong review ya bang", createdAt: minutesAgo(2), action: "Review", unread: true },
  { id: "in2", source: "tiktok", actor: "Sari Dewi", verb: "komentar di TikTok", desc: '"Mantap reviewnya bang! Bisa collab ga?"', createdAt: minutesAgo(15), action: "Reply", unread: true },
  { id: "in3", source: "youtube", actor: "Rina Marlina", verb: "reply komentar YouTube", desc: '"Siap bang, saya follow up minggu depan"', createdAt: minutesAgo(120), action: "View", unread: false },
  { id: "in4", source: "twitter", actor: "Dewi Lestari", verb: "mention di X", desc: "@BangBaySetiapPlatform review dong", createdAt: minutesAgo(240), action: "Reply", unread: true },
  { id: "in5", source: "email", actor: "Reminder", verb: "invoice hosting", desc: "Bayar invoice deadline besok - Rp 850.000", createdAt: minutesAgo(300), action: "Pay", unread: false },
];

/**
 * Hook unified inbox: items + unreadCount + markAsRead.
 * Stat card pakai `unreadCount`; Activity Feed pakai `items` + `markAsRead`.
 * Klik item → markAsRead(id) → flag unread flip → angka kartu turun otomatis.
 */
export function useInbox() {
  // TODO(langkah-1): tambahkan fetch email asli (himalaya) + notif sosmed (Zernio).
  // Nanti items awal dari fetch, markAsRead jadi API call — pola state tetap sama.
  const [items, setItems] = useState<InboxItem[]>(MOCK_INBOX);

  /** Tandai 1 item sudah dibaca (flip unread → false) */
  const markAsRead = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, unread: false } : it))
    );
  }, []);

  /** Tandai SEMUA item sudah dibaca */
  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((it) => ({ ...it, unread: false })));
  }, []);

  const unreadCount = useMemo(() => items.filter((i) => i.unread).length, [items]);

  return { items, unreadCount, markAsRead, markAllRead };
}
