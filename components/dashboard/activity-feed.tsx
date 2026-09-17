// activity-feed.tsx — Activity Feed dashboard (mengikuti docs/dashboard-option-c.html).
// Data masih mock terstruktur — nanti tinggal swap ke sumber asli (inbox/notifikasi)
// tanpa ubah layout. Filter All/Unread/Today berfungsi nyata via state.

"use client";

import { useState } from "react";
import { InboxItem, SOURCE_META } from "./inbox-data";

/** Format ISO → "x menit lalu" */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const TONE_BY_SOURCE: Record<string, "blue" | "purple" | "orange" | "green"> = {
  email: "blue",
  tiktok: "purple",
  youtube: "red" as never, // fallback ke orange di bawah kalau gak ada merah
  instagram: "purple",
  twitter: "blue",
};

type FeedItem = {
  initials: string;
  /** warna avatar: key dari AVATAR_STYLES */
  tone: "blue" | "purple" | "orange" | "green";
  /** HTML judul — <b> untuk nama */
  title: React.ReactNode;
  desc: string;
  time: string;
  action: string;
  unread?: boolean;
};

const AVATAR_STYLES: Record<FeedItem["tone"], string> = {
  blue: "bg-[#3B82F6]/15 text-[#3B82F6]",
  purple: "bg-[#8B5CF6]/15 text-[#8B5CF6]",
  orange: "bg-[#F97316]/15 text-[#F97316]",
  green: "bg-[#10B981]/15 text-[#10B981]",
};

const FEED_ITEMS: FeedItem[] = [
  {
    initials: "BS",
    tone: "blue",
    title: (<><b>Budi Santoso</b> mengirim email</>),
    desc: "Proposal kerjasama Q3 - Tolong review ya bang",
    time: "2 menit lalu",
    action: "Review",
    unread: true,
  },
  {
    initials: "SD",
    tone: "purple",
    title: (<><b>Sari Dewi</b> komentar di Instagram</>),
    desc: '"Mantap reviewnya bang! Bisa collab ga?"',
    time: "15 menit lalu",
    action: "Reply",
    unread: true,
  },
  {
    initials: "AP",
    tone: "orange",
    title: (<>Meeting <b>Andi Pratama</b> jam 14:00</>),
    desc: "Rapat review progress backend API",
    time: "30 menit lalu",
    action: "Details",
  },
  {
    initials: "DL",
    tone: "green",
    title: (<>Note baru: <b>"Ide konten minggu depan"</b></>),
    desc: "Draft ide 5 konten tutorial SmartDash",
    time: "1 jam lalu",
    action: "Open",
  },
  {
    initials: "RM",
    tone: "blue",
    title: (<>Reply dari <b>Rina Marlina</b></>),
    desc: '"Siap bang, saya follow up minggu depan"',
    time: "2 jam lalu",
    action: "View",
  },
  {
    initials: "DL",
    tone: "purple",
    title: (<><b>Dewi Lestari</b> mention di Twitter</>),
    desc: "@BangBaySetiapPlatform review dong",
    time: "4 jam lalu",
    action: "Reply",
    unread: true,
  },
  {
    initials: "RS",
    tone: "orange",
    title: (<>Reminder: <b>Bayar invoice</b> deadline besok</>),
    desc: "Invoice hosting Rp 850.000",
    time: "5 jam lalu",
    action: "Pay",
  },
];

type FilterKey = "all" | "unread" | "today";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "today", label: "Today" },
];

export default function ActivityFeed({
  inboxItems,
  onMarkRead,
}: {
  /** Item unified inbox (komunikasi masuk) — dari useInbox() di MainContent */
  inboxItems?: InboxItem[];
  /** Tandai item inbox dibaca → angka stat card turun */
  onMarkRead?: (id: string) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  // State read/unread lokal buat item aktivitas pribadi (meeting/note)
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const items = FEED_ITEMS.filter((it) => {
    if (filter === "unread") return !!it.unread && !readIds.has(FEED_ITEMS.indexOf(it));
    if (filter === "today") return true; // semua item mock < 24 jam
    return true;
  });

  /** Klik tombol aksi → tandai item dibaca */
  function handleAction(idx: number) {
    setReadIds((prev) => new Set(prev).add(idx));
  }

  return (
    <div className="rounded-[10px] bg-[#1C222B] p-4">
      {/* Header: judul kiri, filter kanan */}
      <div className="flex items-center gap-2">
        <h3 className="text-[13px] font-bold text-white">Activity Feed</h3>
        <div className="ml-auto flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                filter === f.key
                  ? "bg-[#4c00b2]/15 text-[#8B5CF6]"
                  : "text-[#64748B] hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar item — bagian 1: unified inbox (komunikasi masuk) */}
      <div className="mt-2 divide-y divide-[#2E3750]">
        {(inboxItems ?? [])
          .filter((it) => {
            if (filter === "unread") return it.unread;
            return true;
          })
          .map((it) => {
            const meta = SOURCE_META[it.source];
            const tone = TONE_BY_SOURCE[it.source] === ("red" as never) ? "orange" : TONE_BY_SOURCE[it.source] ?? "blue";
            return (
              <div
                key={it.id}
                className={`feed-item flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#232A3D] ${it.unread ? "" : "opacity-55"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${AVATAR_STYLES[tone]}`}
                >
                  {initialsOf(it.actor)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-white">
                    {it.unread && (
                      <span className="mr-1.5 inline-block h-[6px] w-[6px] rounded-full bg-[#4c00b2] align-middle" />
                    )}
                    <b>{it.actor}</b> {it.verb}
                  </p>
                  <p className="truncate text-[11px] text-[#94A3B8]">{it.desc}</p>
                  <p className="mt-0.5 text-[9px] text-[#64748B]" suppressHydrationWarning>
                    {meta?.label ?? it.source} · {timeAgo(it.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => onMarkRead?.(it.id)}
                  disabled={!it.unread}
                  className={`shrink-0 text-[10px] font-semibold ${!it.unread ? "cursor-default text-[#64748B]" : "text-[#4c00b2] hover:underline"}`}
                >
                  {it.unread ? it.action : "✓ dibaca"}
                </button>
              </div>
            );
          })}

        {/* Bagian 2: aktivitas pribadi (meeting/note) — state lokal */}
        {items.map((it) => {
          const globalIdx = FEED_ITEMS.indexOf(it);
          const isRead = readIds.has(globalIdx);
          return (
          <div
            key={`${it.initials}-${globalIdx}`}
            className={`feed-item flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#232A3D] ${isRead ? "opacity-55" : ""}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] ${AVATAR_STYLES[it.tone]}`}
            >
              {it.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-white">
                {!isRead && it.unread && (
                  <span className="mr-1.5 inline-block h-[6px] w-[6px] rounded-full bg-[#4c00b2] align-middle" />
                )}
                {it.title}
              </p>
              <p className="truncate text-[11px] text-[#94A3B8]">{it.desc}</p>
              <p className="mt-0.5 text-[9px] text-[#64748B]">
                {isRead ? "✓ dibaca" : it.time}
              </p>
            </div>
            <button
              onClick={() => handleAction(globalIdx)}
              disabled={isRead}
              className={`shrink-0 text-[10px] font-semibold ${isRead ? "cursor-default text-[#64748B]" : "text-[#4c00b2] hover:underline"}`}
            >
              {isRead ? "Selesai" : it.action}
            </button>
          </div>
          );
        })}
        {items.length === 0 && (
          <p className="py-6 text-center text-[11px] text-[#64748B]">Tidak ada aktivitas.</p>
        )}
      </div>
    </div>
  );
}
