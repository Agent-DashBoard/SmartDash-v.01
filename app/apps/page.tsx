"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

// Render pesan agent sebagai markdown (tebal, miring, blok kode, list — bukan teks mentah)
function MarkdownRenderer({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        code: ({ children }) => (
          <code className="rounded bg-[#0E1116] px-1 py-0.5 text-[12px] text-[#FBBF24]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-lg bg-[#0E1116] p-3 text-[12px] text-[#E2E8F0]">
            {children}
          </pre>
        ),
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
        strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

type Msg = {
  role: "user" | "agent" | "error";
  text: string;
};

type Session = {
  id: number;
  title: string;
  pinned?: boolean;
  // Session id Hermes Agent (multi-turn) — diisi setelah chat pertama
  hermesSessionId?: string;
};

// Sesi chat contoh — meniru sidebar kiri Hermes Desktop Chat
const INITIAL_SESSIONS: Session[] = [
  { id: 1, title: "Kerangka Layout SmartDash" },
  { id: 2, title: "PR Apps" },
  { id: 3, title: "Content Performance BarChart" },
];

const INITIAL_MESSAGES: Msg[] = [
  {
    role: "agent",
    text: "Halo! 👋 Aku **SmartDash**, asisten AI-mu. Aku bisa bantu soal dashboard, analitik konten, automasi, atau apa aja yang berhubungan dengan project kamu. Mau tanya apa hari ini?",
  },
];

// ===== Skill (tab Skill) — 3 kartu: Personality · Skill · Memories =====
type SkillItem = {
  name: string;
  desc: string;
  on: boolean;
  cat: string;
};

type MemoryItem = {
  text: string;
  on: boolean;
};

type SkillPanel = "personality" | "skill" | "memories" | null;

const INITIAL_SKILLS: SkillItem[] = [
  { name: "creative", desc: "Konten kreatif: gambar, video, desain", on: true, cat: "Bawaan" },
  { name: "email", desc: "Kirim & baca email dari terminal", on: true, cat: "Bawaan" },
  { name: "github", desc: "Kelola repo & PR via gh CLI", on: true, cat: "Bawaan" },
  { name: "media", desc: "Transkrip YouTube, audio, GIF", on: true, cat: "Bawaan" },
  { name: "note-taking", desc: "Catatan & riset multi-sesi", on: false, cat: "Bawaan" },
  { name: "productivity", desc: "Dokumen, slide, spreadsheet", on: false, cat: "Bawaan" },
  { name: "research", desc: "Cari paper & riset pasar", on: false, cat: "Bawaan" },
  { name: "Resep konten TikTok viral", desc: "Formula hook 2 detik + pacing + CTA", on: true, cat: "Milikmu" },
  { name: "Analisa data YouTube", desc: "Cara baca retention & pilih judul", on: true, cat: "Milikmu" },
];

const INITIAL_MEMORIES: MemoryItem[] = [
  { text: "Nama user: Bayu (sapaan akrab). Berbahasa Indonesia.", on: true },
  { text: "Deadline konten TikTok tiap Jumat malam.", on: true },
];

// ===== Kategori skill — mengikuti struktur platform (referensi gambar BangBay) =====
type SkillCatGroup = { group: string; options: { value: string; label: string }[] };

const SKILL_CATEGORIES: SkillCatGroup[] = [
  {
    group: "SOCIAL",
    options: [
      { value: "instagram", label: "Instagram" },
      { value: "facebook", label: "Facebook" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "twitter-x", label: "Twitter/X" },
      { value: "threads", label: "Threads" },
      { value: "bluesky", label: "Bluesky" },
      { value: "pinterest", label: "Pinterest" },
      { value: "reddit", label: "Reddit" },
      { value: "google-business", label: "Google Business" },
      { value: "tiktok", label: "TikTok" },
      { value: "youtube", label: "YouTube" },
      { value: "snapchat", label: "Snapchat" },
    ],
  },
  {
    group: "COMMUNICATION",
    options: [
      { value: "telegram", label: "Telegram" },
      { value: "discord", label: "Discord" },
      { value: "slack", label: "Slack" },
      { value: "whatsapp", label: "WhatsApp" },
    ],
  },
  {
    group: "ADS",
    options: [
      { value: "meta-ads", label: "Meta Ads" },
      { value: "linkedin-ads", label: "LinkedIn Ads" },
      { value: "pinterest-ads", label: "Pinterest Ads" },
      { value: "tiktok-ads", label: "TikTok Ads" },
      { value: "google-ads", label: "Google Ads" },
    ],
  },
  {
    group: "EMAIL",
    options: [
      { value: "gmail", label: "Gmail" },
      { value: "outlook", label: "Outlook" },
    ],
  },
  {
    group: "UMUM (kategori bawaan Hermes)",
    options: [
      { value: "creative", label: "creative" },
      { value: "productivity", label: "productivity" },
      { value: "research", label: "research" },
      { value: "media", label: "media" },
      { value: "email", label: "email" },
      { value: "github", label: "github" },
      { value: "note-taking", label: "note-taking" },
    ],
  },
];

const SOUL_CONTENT = `# SOUL.md — Kepribadian SmartDash AI

Namamu adalah SmartDash — asisten AI pribadi platform SmartDash,
dashboard creator konten all-in-one (TikTok · YouTube · Instagram · WhatsApp).

## Identitas
- Kamu adalah SmartDash, asisten AI dari platform SmartDash.
- Kalau ditanya nama → jawab "SmartDash".
- JANGAN PERNAH menyebut Hermes/DeepSeek/OpenAI/Claude ke user.
- Bahasa Indonesia, ramah & santai.

## Aturan
- Jawab singkat & jelas.
- Jangan menjanjikan fitur yang belum tersedia.`;

// 5 aplikasi mini di dalam Apps (ejaan benar: Calendar — referensi typo "Calender")
const APPS_TABS = ["Agent", "Email", "Skill", "Notes", "Calendar"] as const;
type AppTab = (typeof APPS_TABS)[number];

// ===== Calendar (tab Calendar) — view + grid bulan =====
const CAL_VIEWS = ["Month", "Week", "Day", "Agenda"] as const;
type CalView = (typeof CAL_VIEWS)[number];

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Bangun 42 sel (6 baris × 7 kolom, mulai Minggu — ikut label hari gambar BangBay: Sun..Sat):
// angka bulan aktif + sisa bulan tetangga; tiap sel bawa Date asli (buat klik → popup Add Event)
function buildMonthCells(
  year: number,
  month: number
): { day: number; inMonth: boolean; date: Date }[] {
  const offset = new Date(year, month, 1).getDay(); // Minggu=0
  const start = new Date(year, month, 1 - offset);
  const cells: { day: number; inMonth: boolean; date: Date }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ day: d.getDate(), inMonth: d.getMonth() === month, date: d });
  }
  return cells;
}

// ===== Agenda (tab Calendar, view Agenda) — semua event berkumpul di sini =====
type AgendaEvent = {
  id: number;
  date: string; // ISO "2026-08-08"
  time: string; // label waktu: "All day" / "Aug 4 – Aug 5" (event baru dari popup)
  title: string;
  color: string; // warna event — dot di tabel agenda + sel bulan
};

// 5 warna event — ikut modal "Add Event" (indigo · teal · red · sky · amber)
const EVENT_COLORS = ["#4F46E5", "#14B8A6", "#EF4444", "#38BDF8", "#F59E0B"];

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_EN_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Agenda mulai KOSONG — semua event masuk lewat popup "Add Event" (klik tanggal)
const INITIAL_EVENTS: AgendaEvent[] = [];

// Date → ISO "YYYY-MM-DD"
function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Label waktu event baru: "All day" (1 hari) / "Aug 4 – Aug 5" (multi hari)
function eventTimeLabel(startIso: string, endIso: string): string {
  if (startIso === endIso) return "All day";
  const s = new Date(startIso + "T00:00:00");
  const e = new Date(endIso + "T00:00:00");
  return `${MONTHS_EN_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTHS_EN_SHORT[e.getMonth()]} ${e.getDate()}`;
}

// ===== Helper Week/Day view =====
// Tanggal mulai minggu (Minggu = awal — konsisten dengan grid Month)
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Minggu
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

// Tambah n hari (aman lintas bulan/tahun)
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// Range minggu buat tengah control bar: "Aug 2 – Aug 8, 2026"
function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear())
    return `${MONTHS_EN_SHORT[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  if (start.getFullYear() === end.getFullYear())
    return `${MONTHS_EN_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTHS_EN_SHORT[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
  return `${MONTHS_EN_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTHS_EN_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Judul hari buat tengah control bar Day view: "Sabtu, 08 Agustus 2026"
function formatDayTitle(d: Date): string {
  return `${DAYS_ID[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
}

// Format tanggal agenda: "Sat Aug 08" (persis gambar)
function formatAgendaDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${DAYS_EN[d.getDay()]} ${MONTHS_EN_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}`;
}

// Format range tengah agenda: "08/07/2026" (MM/DD/YYYY — persis gambar)
function mmdd(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

// ===== Notes (tab Notes) — catatan sederhana =====
type Note = {
  id: number;
  title: string;
  body: string;
  date: string;
  color: string;
};

// 5 warna catatan — ikut referensi modal "Add New Note" (yellow, blue, red, green, light blue)
const NOTE_COLORS = ["#FACC15", "#3B82F6", "#EF4444", "#10B981", "#60A5FA"];

const INITIAL_NOTES: Note[] = [
  {
    id: 1,
    title: "Lorem ipsum dolor sit a...",
    body:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    date: "04/06/2023",
    color: NOTE_COLORS[0],
  },
];

// Hook jam — pola sama dengan dashboard (main-content.tsx): timeout 0 dulu biar hydration aman
function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return now;
}

export default function AppsPage() {
  const [activeTab, setActiveTab] = useState<AppTab>("Agent");
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [activeSession, setActiveSession] = useState(1);
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  // Loading — Hermes lagi mikir (tab Agent)
  const [loading, setLoading] = useState(false);
  // Menu ⋮ per sesi
  const [menuFor, setMenuFor] = useState<number | null>(null);
  // Rename inline
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  // Email client (tab Email) — folder aktif + search (UI doang)
  const [emailFolder, setEmailFolder] = useState("Inbox");
  const [emailSearch, setEmailSearch] = useState("");
  // Compose modal
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeFile, setComposeFile] = useState("");
  // Notes — catatan + search
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [activeNoteId, setActiveNoteId] = useState(INITIAL_NOTES[0]?.id ?? 0);
  const [notesSearch, setNotesSearch] = useState("");
  // Modal "Add New Note" — buat catatan baru
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteColor, setNewNoteColor] = useState(NOTE_COLORS[1]); // blue (default selected)
  // Calendar (tab Calendar) — bulan aktif + view (referensi gambar BangBay)
  const [calCursor, setCalCursor] = useState(() => new Date(2026, 7, 1)); // Agustus 2026
  const [calView, setCalView] = useState<CalView>("Month");
  // Agenda — semua event berkumpul di sini (mulai kosong, diisi lewat popup Add Event)
  // Persist: baca dari localStorage supaya agenda gak hilang saat refresh
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>(() => {
    if (typeof window === "undefined") return INITIAL_EVENTS;
    try {
      const raw = window.localStorage.getItem("smartdash-agenda");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as AgendaEvent[];
      }
    } catch {
      // localStorage tidak tersedia / data korup → mulai kosong
    }
    return INITIAL_EVENTS;
  });
  // Modal "Add Event" — muncul saat klik tanggal di Month view
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0]); // indigo (default selected)
  // Konfirmasi hapus event — id event yang mau dihapus (null = modal tertutup)
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  // Skill (tab Skill) — 3 kartu: Personality · Skill · Memories
  const [skillPanel, setSkillPanel] = useState<SkillPanel>(null);
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);
  const [memories, setMemories] = useState<MemoryItem[]>(INITIAL_MEMORIES);
  // Modal tambah skill / edit jiwa / tambah catatan
  const [skillModal, setSkillModal] = useState<"addSkill" | "editSoul" | "addMemory" | "editSkill" | "editMemory" | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCat, setNewSkillCat] = useState("creative");
  const [newSkillBody, setNewSkillBody] = useState("");
  const [editSoulText, setEditSoulText] = useState(SOUL_CONTENT);
  const [newMemoryText, setNewMemoryText] = useState("");
  // Index item yang sedang diedit (null = tidak ada)
  const [editSkillIndex, setEditSkillIndex] = useState<number | null>(null);
  const [editMemoryIndex, setEditMemoryIndex] = useState<number | null>(null);

  // Jam — pola sama dengan dashboard
  const now = useClock();
  const time = now
    ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  // Simpan agenda ke localStorage tiap berubah (persist — gak hilang saat refresh)
  useEffect(() => {
    try {
      window.localStorage.setItem("smartdash-agenda", JSON.stringify(agendaEvents));
    } catch {
      // localStorage penuh / tidak tersedia — abaikan
    }
  }, [agendaEvents]);

  // Awal minggu dari cursor (dipakai Week view)
  const calWeekStart = startOfWeek(calCursor);

  const pinnedSessions = sessions.filter((s) => s.pinned);
  const otherSessions = sessions.filter((s) => !s.pinned);

  function handleNewSession() {
    const nextId = Math.max(0, ...sessions.map((s) => s.id)) + 1;
    setSessions((prev) => [{ id: nextId, title: "Sesi baru" }, ...prev]);
    setActiveSession(nextId);
    setMessages([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // User bubble + riwayat yang akan dikirim ke otak Hermes
    const userMsg: Msg = { role: "user", text };
    const history: Msg[] = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/hermes/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role === "error" ? "user" : m.role, content: m.text })),
          // Resume sesi Hermes Agent (kalau sudah ada) biar percakapan nyambung
          sessionId: sessions.find((s) => s.id === activeSession)?.hermesSessionId ?? null,
        }),
      });
      const data = await res.json();

      if (data?.ok && typeof data.reply === "string" && data.reply.trim()) {
        setMessages((prev) => [...prev, { role: "agent", text: data.reply }]);
        // Simpan session id Hermes Agent → multi-turn nyambung
        if (typeof data.sessionId === "string" && data.sessionId) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSession ? { ...s, hermesSessionId: data.sessionId } : s
            )
          );
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "error", text: `⚠️ ${data?.error || "Terjadi kesalahan — coba lagi."}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: "⚠️ Gagal terhubung ke server. Pastikan gateway SmartDash aktif, lalu coba lagi." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startRename(s: Session) {
    setRenamingId(s.id);
    setRenameValue(s.title);
    setMenuFor(null);
  }

  function finishRename() {
    if (renamingId == null) return;
    const title = renameValue.trim();
    setSessions((prev) =>
      prev.map((x) => (x.id === renamingId ? { ...x, title: title || x.title } : x))
    );
    setRenamingId(null);
  }

  function togglePin(s: Session) {
    setSessions((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, pinned: !x.pinned } : x))
    );
    setMenuFor(null);
  }

  function handleDelete(s: Session) {
    const next = sessions.filter((x) => x.id !== s.id);
    // Kalau sesi aktif dihapus → pindah ke sesi pertama yang tersisa (atau kosong)
    if (s.id === activeSession) {
      const fallback = next[0];
      setActiveSession(fallback ? fallback.id : 0);
      setMessages(fallback && fallback.id === 1 ? INITIAL_MESSAGES : []);
    }
    setSessions(next);
    setMenuFor(null);
    if (renamingId === s.id) setRenamingId(null);
  }

  // ===== Notes handlers =====
  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;
  const filteredNotes = notes.filter((n) =>
    `${n.title} ${n.body}`.toLowerCase().includes(notesSearch.toLowerCase())
  );

  function todayStr() {
    return new Date().toLocaleDateString("en-GB");
  }

  function openAddNote() {
    setNewNoteTitle("");
    setNewNoteText("");
    setNewNoteColor(NOTE_COLORS[1]); // blue (default selected)
    setNoteModalOpen(true);
  }

  function saveNewNote() {
    const title = newNoteTitle.trim();
    const text = newNoteText.trim();
    const nextId = Math.max(0, ...notes.map((n) => n.id)) + 1;
    const note: Note = {
      id: nextId,
      title: title || text.split("\n")[0].slice(0, 40) || "New Note",
      body: newNoteText,
      date: todayStr(),
      color: newNoteColor,
    };
    setNotes((prev) => [note, ...prev]);
    setActiveNoteId(nextId);
    setNoteModalOpen(false);
  }

  function handleDeleteNote(id: number) {
    const next = notes.filter((n) => n.id !== id);
    if (id === activeNoteId) {
      setActiveNoteId(next[0] ? next[0].id : 0);
    }
    setNotes(next);
  }

  function handleNoteField(id: number, field: "title" | "body", value: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, [field]: value } : n))
    );
  }

  function handleNoteColor(color: string) {
    if (!activeNoteId) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNoteId ? { ...n, color } : n))
    );
  }

  // ===== Calendar handlers =====
  function goPrev() {
    if (calView === "Week") {
      setCalCursor((c) => startOfWeek(addDays(c, -7)));
    } else if (calView === "Day") {
      setCalCursor((c) => addDays(c, -1));
    } else {
      // Month (dan Agenda — cursor bulan tetap, range agenda ikut hari ini)
      setCalCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    }
  }
  function goNext() {
    if (calView === "Week") {
      setCalCursor((c) => startOfWeek(addDays(c, 7)));
    } else if (calView === "Day") {
      setCalCursor((c) => addDays(c, 1));
    } else {
      setCalCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    }
  }
  function goToday() {
    const n = new Date();
    if (calView === "Month" || calView === "Agenda") {
      setCalCursor(new Date(n.getFullYear(), n.getMonth(), 1));
    } else if (calView === "Week") {
      setCalCursor(startOfWeek(n));
    } else {
      setCalCursor(n);
    }
  }

  // ===== Add Event — klik tanggal di Month view → popup → otomatis masuk agenda =====
  function openEventModal(date: Date) {
    const iso = toISODate(date);
    setEventTitle("");
    setEventStart(iso);
    setEventEnd(iso);
    setEventColor(EVENT_COLORS[0]); // indigo (default selected)
    setEventModalOpen(true);
  }

  function saveEvent() {
    if (!eventStart) return;
    const title = eventTitle.trim() || "New Event";
    const nextId = Math.max(0, ...agendaEvents.map((e) => e.id)) + 1;
    const ev: AgendaEvent = {
      id: nextId,
      date: eventStart,
      time: eventTimeLabel(eventStart, eventEnd || eventStart),
      title,
      color: eventColor,
    };
    setAgendaEvents((prev) => [...prev, ev]);
    setEventModalOpen(false);
  }

  // ===== Delete Event — trash icon di 4 view → konfirmasi → hapus =====
  function requestDeleteEvent(id: number) {
    setDeleteEventId(id);
  }
  function cancelDeleteEvent() {
    setDeleteEventId(null);
  }
  function confirmDeleteEvent() {
    if (deleteEventId === null) return;
    setAgendaEvents((prev) => prev.filter((e) => e.id !== deleteEventId));
    setDeleteEventId(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden bg-[#0E1116] px-3 py-2 [font-family:Inter,var(--font-geist-sans),system-ui,sans-serif]">
      {/* Header: judul + breadcrumb + jam + dot status (sama seperti dashboard) */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-bold leading-[1.21] text-white">Apps</h1>
          <p className="text-[13px] text-[#94A3B8]">Dashboard • Apps</p>
        </div>
        <div className="flex items-center gap-[10px]">
          {/* Text jam — leading-none biar line-box = font-size (center akurat) */}
          <span className="translate-y-[1.5px] text-[15px] font-bold leading-none tracking-[0.02em] text-white">{time}</span>
          {/* Dot hijau status — lebih besar (referensi 19px), berdenyut halus */}
          <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B00] opacity-20" />
            <span className="relative inline-flex h-[18px] w-[18px] animate-pulse-dot rounded-full bg-[#00FF2F]" />
          </span>
        </div>
      </header>

      {/* Tab bar — kotak pil rounded, tab aktif border ungu/oranye (ikut referensi 01) */}
      <div className="flex flex-wrap items-center gap-2">
        {APPS_TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                active
                  ? "border border-[#F97316] bg-[#F97316]/10 text-[#F97316]"
                  : "border border-transparent text-[#94A3B8] hover:bg-[#2A3347] hover:text-[#E2E8F0]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Konten per tab */}
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {activeTab === "Agent" ? (
          /* ===== Tab Agent — meniru Hermes Desktop Chat (04-hermes-desktop-chat.png) ===== */
          <section className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[#2E3750] bg-[#1C222B]">
            {/* Kolom kiri: daftar sesi */}
            <aside className="flex w-56 shrink-0 flex-col border-r border-[#2E3750] bg-[#0E1116]">
              <div className="border-b border-[#2E3750] p-3">
                <button
                  type="button"
                  onClick={handleNewSession}
                  className="w-full rounded-lg bg-[#F97316] px-3 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                >
                  + New Session
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {/* Sesi PINNED */}
                <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Pinned
                </p>
                {pinnedSessions.length === 0 ? (
                  <p className="px-2 pb-2 text-[11px] text-[#64748B]">Shift-click a chat to pin</p>
                ) : (
                  <div className="mb-2">
                    {pinnedSessions.map((s) => (
                      <SessionItem
                        key={s.id}
                        session={s}
                        active={s.id === activeSession}
                        menuOpen={menuFor === s.id}
                        renaming={renamingId === s.id}
                        renameValue={renameValue}
                        onRenameValue={setRenameValue}
                        onSelect={() => {
                          setActiveSession(s.id);
                          setMessages(s.id === 1 ? INITIAL_MESSAGES : []);
                        }}
                        onMenu={() => setMenuFor(menuFor === s.id ? null : s.id)}
                        onRename={() => startRename(s)}
                        onFinishRename={finishRename}
                        onCancelRename={() => setRenamingId(null)}
                        onPin={() => togglePin(s)}
                        onDelete={() => handleDelete(s)}
                      />
                    ))}
                  </div>
                )}

                {/* Sesi lain (tidak pinned) */}
                <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Sessions
                </p>
                {otherSessions.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    active={s.id === activeSession}
                    menuOpen={menuFor === s.id}
                    renaming={renamingId === s.id}
                    renameValue={renameValue}
                    onRenameValue={setRenameValue}
                    onSelect={() => {
                      setActiveSession(s.id);
                      setMessages(s.id === 1 ? INITIAL_MESSAGES : []);
                    }}
                    onMenu={() => setMenuFor(menuFor === s.id ? null : s.id)}
                    onRename={() => startRename(s)}
                    onFinishRename={finishRename}
                    onCancelRename={() => setRenamingId(null)}
                    onPin={() => togglePin(s)}
                    onDelete={() => handleDelete(s)}
                  />
                ))}
              </div>
            </aside>

            {/* Kolom kanan: area chat */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Daftar pesan */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-[13px] text-[#64748B]">
                    Sesi baru — tulis pesan untuk mulai ngobrol dengan Agent.
                  </p>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3.5 py-2 text-[13px] leading-relaxed ${
                          m.role === "user"
                            ? "bg-[#2A3347] text-[#E2E8F0]"
                            : m.role === "error"
                              ? "border border-[#EF4444]/40 bg-[#EF4444]/10 text-[#FCA5A5]"
                              : "bg-transparent text-[#E2E8F0]"
                        }`}
                      >
                        {m.role === "agent" ? (
                          <MarkdownRenderer text={m.text} />
                        ) : (
                          m.text
                        )}
                      </div>
                    </div>
                  ))
                )}
                {/* Indikator: Hermes lagi mikir… */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-[#1C222B] px-3.5 py-2 text-[13px] text-[#94A3B8]">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F97316] [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F97316] [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F97316] [animation-delay:300ms]" />
                      </span>
                      SmartDash lagi mikir…
                    </div>
                  </div>
                )}
              </div>

              {/* Input box */}
              <form
                onSubmit={handleSubmit}
                className="flex shrink-0 items-center gap-2 border-t border-[#2E3750] p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tulis pesan ke Agent…"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-10 shrink-0 rounded-lg bg-[#F97316] px-4 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                >
                  Kirim
                </button>
              </form>
            </div>
          </section>
        ) : activeTab === "Email" ? (
          /* ===== Tab Email — klien email (referensi 03-email-client.jpg / screenshot BangBay) ===== */
          <section className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[#2E3750] bg-[#1C222B]">
            {/* Sidebar kiri email */}
            <aside className="flex w-56 shrink-0 flex-col border-r border-[#2E3750] bg-[#0E1116]">
              <div className="border-b border-[#2E3750] p-3">
                <button
                  type="button"
                  onClick={() => setComposeOpen(true)}
                  className="w-full rounded-lg bg-[#3B82F6] px-3 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                >
                  Compose
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {/* Folder email */}
                {["Inbox", "Send", "Draft", "Spam", "Trash"].map((f) => {
                  const active = f === emailFolder;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setEmailFolder(f)}
                      className={`mb-1 block w-full truncate rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                        active
                          ? "bg-[#3B82F6]/25 font-semibold text-white"
                          : "text-[#94A3B8] hover:bg-[#232A3D] hover:text-[#E2E8F0]"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}

                {/* Divider */}
                <div className="my-2 h-px bg-[#2E3750]" />

                {/* SORT BY */}
                <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Sort by
                </p>
                {["Starred", "Important"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      /* Sort — UI doang */
                    }}
                    className="mb-1 block w-full truncate rounded-lg px-3 py-2 text-left text-[13px] text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-[#E2E8F0]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </aside>

            {/* Main area email */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Search bar */}
              <div className="border-b border-[#2E3750] p-3">
                <input
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  placeholder="Search Emails"
                  className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {/* Daftar email — kosong dulu (UI doang) */}
              <div className="flex flex-1 items-center justify-center p-3">
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-[#2E3750]">
                  <p className="text-[13px] text-[#64748B]">
                    Tidak ada email di {emailFolder}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : activeTab === "Notes" ? (
          /* ===== Tab Notes — catatan (referensi screenshot BangBay) ===== */
          <section className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[#2E3750] bg-[#1C222B]">
            {/* Sidebar kiri: daftar catatan */}
            <aside className="flex w-56 shrink-0 flex-col border-r border-[#2E3750] bg-[#0E1116]">
              <div className="border-b border-[#2E3750] p-3">
                <input
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                  placeholder="Search Notes"
                  className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  All Notes
                </p>
                {filteredNotes.length === 0 ? (
                  <p className="px-2 py-1 text-[12px] text-[#64748B]">
                    Tidak ada catatan.
                  </p>
                ) : (
                  filteredNotes.map((n) => {
                    const active = n.id === activeNoteId;
                    return (
                      <div
                        key={n.id}
                        className="group relative mb-2 overflow-hidden rounded-lg border px-3 py-2"
                        style={{
                          backgroundColor: n.color + (active ? "33" : "1A"),
                          borderColor: active ? n.color : "transparent",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveNoteId(n.id)}
                          className="block w-full pr-6 text-left"
                        >
                          <p className="truncate text-[13px] font-semibold text-white">
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#94A3B8]">{n.date}</p>
                        </button>
                        {/* Trash icon — hapus catatan */}
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(n.id)}
                          aria-label={`Hapus catatan ${n.title}`}
                          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#EF4444]/20 hover:text-[#EF4444]"
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Main area: Edit Note */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                <h2 className="text-[15px] font-bold text-white">Edit Note</h2>
                <button
                  type="button"
                  onClick={openAddNote}
                  className="rounded-lg bg-[#8B5CF6] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                >
                  Add Note
                </button>
              </div>

              {activeNote ? (
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {/* Editor box */}
                  <div className="rounded-xl border border-[#3D4A63] bg-[#0E1116] p-4">
                    <input
                      value={activeNote.title}
                      onChange={(e) =>
                        handleNoteField(activeNote.id, "title", e.target.value)
                      }
                      placeholder="Judul catatan"
                      className="w-full bg-transparent text-[15px] font-bold text-white placeholder:text-[#64748B] focus:outline-none"
                    />
                    <textarea
                      value={activeNote.body}
                      onChange={(e) =>
                        handleNoteField(activeNote.id, "body", e.target.value)
                      }
                      placeholder="Tulis catatan…"
                      rows={9}
                      className="mt-3 w-full resize-y bg-transparent text-[13px] leading-relaxed text-white placeholder:text-[#64748B] focus:outline-none"
                    />
                  </div>

                  {/* Change Note Color */}
                  <div>
                    <h3 className="text-[13px] font-semibold text-white">
                      Change Note Color
                    </h3>
                    <div className="mt-2 flex gap-2">
                      {NOTE_COLORS.map((c) => {
                        const selected = activeNote.color === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleNoteColor(c)}
                            aria-label={`Warna catatan ${c}`}
                            className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                              selected
                                ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#1C222B]"
                                : ""
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-[13px] text-[#64748B]">
                    Pilih catatan atau klik Add Note untuk membuat baru.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : activeTab === "Calendar" ? (
          /* ===== Tab Calendar — kalender bulanan (referensi gambar BangBay) ===== */
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#2E3750] bg-[#1C222B]">
            {/* Control bar */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#2E3750] px-3 py-2">
              {/* Kiri: Today / Back / Next */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-lg border border-[#2E3750] bg-[#232A3D] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#2A3347]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goPrev}
                  className="rounded-lg border border-[#2E3750] bg-[#232A3D] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#2A3347]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-lg border border-[#2E3750] bg-[#232A3D] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#2A3347]"
                >
                  Next
                </button>
              </div>

              {/* Tengah: judul sesuai view */}
              <h2 className="text-[16px] font-bold text-white">
                {calView === "Agenda" ? (
                  now ? (
                    <>
                      {mmdd(now)} –{" "}
                      {mmdd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30))}
                    </>
                  ) : (
                    "…"
                  )
                ) : calView === "Week" ? (
                  <>{formatWeekRange(calWeekStart)}</>
                ) : calView === "Day" ? (
                  <>{formatDayTitle(calCursor)}</>
                ) : (
                  <>
                    {MONTH_NAMES_ID[calCursor.getMonth()]} {calCursor.getFullYear()}
                  </>
                )}
              </h2>

              {/* Kanan: view Month/Week/Day/Agenda — aktif solid ungu (persis gambar Agenda) */}
              <div className="flex items-center overflow-hidden rounded-lg border border-[#2E3750] bg-[#232A3D]">
                {CAL_VIEWS.map((v) => {
                  const active = v === calView;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCalView(v)}
                      className={`px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        active
                          ? "bg-[#8B5CF6] text-white"
                          : "text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid bulan (Month view) — baris label hari + 42 tanggal */}
            {calView === "Month" ? (
              <div className="grid flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))]">
                {/* Baris label hari — Sun Mon Tue Wed Thu Fri Sat (gambar BangBay) */}
                {DAYS_EN.map((d, idx) => {
                  // Kolom hari ini ikut disorot (oranye) kalau sekarang ada di bulan yang ditampilkan
                  const todayCol =
                    now &&
                    now.getFullYear() === calCursor.getFullYear() &&
                    now.getMonth() === calCursor.getMonth()
                      ? now.getDay()
                      : -1;
                  return (
                    <div
                      key={d}
                      className={`border-l border-t border-[#2E3750]/60 px-1.5 py-1 text-center text-[12px] ${
                        idx === todayCol ? "font-bold text-[#F97316]" : "text-[#94A3B8]"
                      }`}
                    >
                      {d}
                    </div>
                  );
                })}
                {buildMonthCells(calCursor.getFullYear(), calCursor.getMonth()).map((cell, i) => {
                  const cellIso = toISODate(cell.date);
                  const dayEvents = agendaEvents.filter((e) => e.date === cellIso);
                  // Penanda hari ini: full kotak warna #262C36 (lembut, senada surface)
                  const isToday = !!now && cellIso === toISODate(now);
                  return (
                    <div
                      key={i}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEventModal(cell.date)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openEventModal(cell.date);
                      }}
                      title={`Tambah event ${cellIso}`}
                      className={`flex h-full w-full cursor-pointer flex-col items-start gap-0.5 border-l border-t border-[#2E3750]/60 p-1.5 text-left transition-colors ${
                        isToday ? "bg-[#262C36]" : "hover:bg-[#232A3D]/70"
                      } ${
                        cell.inMonth ? "text-white" : "text-[#64748B]"
                      }`}
                    >
                      <span className="text-[12px]">{cell.day}</span>
                      {dayEvents.length > 0 && (
                        <span className="flex w-full flex-col gap-0.5">
                          {dayEvents.slice(0, 3).map((e) => (
                            <span
                              key={e.id}
                              className="group flex w-full items-center gap-1 overflow-hidden"
                              title={e.title}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: e.color }}
                              />
                              <span className="truncate text-[10px] leading-tight text-[#E2E8F0]">
                                {e.title}
                              </span>
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  requestDeleteEvent(e.id);
                                }}
                                aria-label={`Hapus event ${e.title}`}
                                className="ml-auto hidden shrink-0 items-center justify-center rounded p-0.5 text-[#94A3B8] transition-colors group-hover:flex hover:text-[#EF4444]"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
                                </svg>
                              </button>
                            </span>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] leading-tight text-[#94A3B8]">
                              +{dayEvents.length - 3} more
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : calView === "Week" ? (
              /* ===== Week view — 7 kolom (Sun..Sat), agenda per hari ===== */
              <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_minmax(0,1fr)]">
                {/* Header: label hari + tanggal */}
                {DAYS_EN.map((d, idx) => {
                  const day = addDays(calWeekStart, idx);
                  const isTodayCol = !!now && toISODate(day) === toISODate(now);
                  return (
                    <div
                      key={d}
                      className={`flex flex-col items-center gap-0.5 border-l border-t border-[#2E3750]/60 px-1 py-1.5 ${
                        isTodayCol ? "text-[#F97316]" : "text-[#94A3B8]"
                      }`}
                    >
                      <span className="text-[11px] font-semibold">{d}</span>
                      <span className="text-[13px] font-bold text-white">
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
                {/* Konten: agenda per hari */}
                {DAYS_EN.map((d, idx) => {
                  const day = addDays(calWeekStart, idx);
                  const dayIso = toISODate(day);
                  const dayEvents = agendaEvents.filter((e) => e.date === dayIso);
                  const isTodayCol = !!now && dayIso === toISODate(now);
                  return (
                    <div
                      key={d}
                      className={`min-h-0 overflow-y-auto border-l border-t border-[#2E3750]/60 p-1 ${
                        isTodayCol ? "bg-[#262C36]" : ""
                      }`}
                    >
                      {dayEvents.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => openEventModal(day)}
                          title={`Tambah event ${dayIso}`}
                          className="w-full rounded px-1 py-1 text-left text-[10px] text-[#64748B] transition-colors hover:bg-[#232A3D]/70"
                        >
                          +
                        </button>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {dayEvents.slice(0, 4).map((e) => (
                            <div
                              key={e.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => openEventModal(day)}
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter" || ev.key === " ") openEventModal(day);
                              }}
                              title={`${e.title} — ${e.time}`}
                              className="group flex w-full cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-[#232A3D]/70"
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: e.color }}
                              />
                              <span className="truncate text-[10px] leading-tight text-[#E2E8F0]">
                                {e.title}
                              </span>
                              <button
                                type="button"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  requestDeleteEvent(e.id);
                                }}
                                aria-label={`Hapus event ${e.title}`}
                                className="ml-auto hidden shrink-0 items-center justify-center rounded p-0.5 text-[#94A3B8] transition-colors group-hover:flex hover:text-[#EF4444]"
                              >
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          {dayEvents.length > 4 && (
                            <span className="px-1 text-[10px] text-[#94A3B8]">
                              +{dayEvents.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : calView === "Day" ? (
              /* ===== Day view — 1 hari detail + agenda ===== */
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="border-b border-[#2E3750]/60 px-4 py-3">
                  <h3 className="text-[15px] font-bold text-white">{formatDayTitle(calCursor)}</h3>
                  {now && toISODate(calCursor) === toISODate(now) && (
                    <span className="mt-1 inline-block rounded-full bg-[#262C36] px-2 py-0.5 text-[10px] font-semibold text-[#F97316]">
                      Hari ini
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 p-3">
                  {agendaEvents.filter((e) => e.date === toISODate(calCursor)).length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <p className="text-[13px] text-[#64748B]">Tidak ada agenda di tanggal ini.</p>
                      <button
                        type="button"
                        onClick={() => openEventModal(calCursor)}
                        className="rounded-lg border border-[#2E3750] bg-[#232A3D] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#2A3347]"
                      >
                        + Tambah Event
                      </button>
                    </div>
                  ) : (
                    agendaEvents
                      .filter((e) => e.date === toISODate(calCursor))
                      .map((e) => (
                        <div
                          key={e.id}
                          className="group flex items-center gap-2 rounded-lg border border-[#2E3750]/60 bg-[#232A3D]/40 px-3 py-2"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: e.color }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-white">{e.title}</p>
                            <p className="text-[11px] text-[#94A3B8]">{e.time}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => requestDeleteEvent(e.id)}
                            aria-label={`Hapus event ${e.title}`}
                            className="ml-auto hidden h-6 w-6 shrink-0 items-center justify-center rounded text-[#94A3B8] transition-colors group-hover:flex hover:bg-[#EF4444]/20 hover:text-[#EF4444]"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ) : calView === "Agenda" ? (
              /* ===== Agenda view — semua agenda berkumpul (persis gambar BangBay) ===== */
              <div className="min-h-0 flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#1C222B]">
                    <tr className="border-b border-[#2E3750]">
                      <th className="px-4 py-2 text-left text-[12px] font-bold text-white">Date</th>
                      <th className="px-4 py-2 text-left text-[12px] font-bold text-white">Time</th>
                      <th className="px-4 py-2 text-left text-[12px] font-bold text-white">Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...agendaEvents]
                      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
                      .map((ev) => (
                        <tr
                          key={ev.id}
                          className="group border-b border-[#2E3750]/60 transition-colors hover:bg-[#232A3D]/60"
                        >
                          <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-white">
                            {formatAgendaDate(ev.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-[13px] text-[#94A3B8]">
                            {ev.time}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-white">
                            <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ev.color }} />
                            {ev.title}
                            <button
                              type="button"
                              onClick={() => requestDeleteEvent(ev.id)}
                              aria-label={`Hapus event ${ev.title}`}
                              className="ml-3 hidden h-6 w-6 items-center justify-center rounded align-middle text-[#94A3B8] transition-colors group-hover:inline-flex hover:bg-[#EF4444]/20 hover:text-[#EF4444]"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    {agendaEvents.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-[13px] text-[#64748B]">
                          Tidak ada agenda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Week/Day — placeholder (belum diimplementasi) */
              <div className="flex flex-1 items-center justify-center">
                <p className="text-[13px] text-[#64748B]">
                  View {calView} — segera hadir
                </p>
              </div>
            )}
          </section>
        ) : activeTab === "Skill" ? (
          /* ===== Tab Skill — 3 kartu (Personality · Skill · Memories) + workspace (layout BangBay) ===== */
          <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            {/* 3 kartu — tetap di atas, konten muncul di workspace bawah */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Kartu Personality */}
              <div
                className={`flex flex-col rounded-xl bg-[#1C222B] p-5 transition-colors ${
                  skillPanel === "personality"
                    ? "bg-[#F97316]/10"
                    : "hover:bg-[#2A3347]"
                }`}
              >
                <h3 className="text-[17px] font-bold text-white">Personality</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#94A3B8]">
                  Kepribadian SmartDash: cara dia bicara, gaya, dan aturan main. Edit kalau mau dia berubah karakter.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full border border-[#2E3750] bg-[#2A3347] px-3 py-1 text-[12px] text-[#E2E8F0]">1 kepribadian</span>
                  <button
                    type="button"
                    onClick={() => setSkillPanel("personality")}
                    className="rounded-lg bg-[#F97316] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                  >
                    Kelola
                  </button>
                </div>
              </div>

              {/* Kartu Skill */}
              <div
                className={`flex flex-col rounded-xl bg-[#1C222B] p-5 transition-colors ${
                  skillPanel === "skill"
                    ? "bg-[#F97316]/10"
                    : "hover:bg-[#2A3347]"
                }`}
              >
                <h3 className="text-[17px] font-bold text-white">Skill</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#94A3B8]">
                  Keahlian yang bisa diajarkan ke SmartDash. Tambah file keahlian baru, atau aktif/nonaktifkan yang ada.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full border border-[#2E3750] bg-[#2A3347] px-3 py-1 text-[12px] text-[#E2E8F0]">{skills.length} keahlian</span>
                  <button
                    type="button"
                    onClick={() => setSkillPanel("skill")}
                    className="rounded-lg bg-[#F97316] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                  >
                    Kelola
                  </button>
                </div>
              </div>

              {/* Kartu Memories */}
              <div
                className={`flex flex-col rounded-xl bg-[#1C222B] p-5 transition-colors ${
                  skillPanel === "memories"
                    ? "bg-[#F97316]/10"
                    : "hover:bg-[#2A3347]"
                }`}
              >
                <h3 className="text-[17px] font-bold text-white">Memories</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[#94A3B8]">
                  Catatan yang SmartDash inget terus: preferensi, fakta, hal penting. Tinggal tulis, dia hafal.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-full border border-[#2E3750] bg-[#2A3347] px-3 py-1 text-[12px] text-[#E2E8F0]">{memories.length} catatan</span>
                  <button
                    type="button"
                    onClick={() => setSkillPanel("memories")}
                    className="rounded-lg bg-[#F97316] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                  >
                    Kelola
                  </button>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-[14px] text-[#E2E8F0]">
              Atur kepintaran SmartDash kamu: tambah keahlian (otak), ubah kepribadian (jiwa), dan isi catatan (ingatan).
            </p>

            {/* Workspace — konten muncul di sini saat kartu diklik */}
            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#2E3750] bg-[#1C222B] p-5">
              {skillPanel === null && (
                <div className="flex h-full min-h-[280px] items-center justify-center text-[14px] text-[#64748B]">
                  Pilih salah satu kartu di atas untuk mulai mengelola
                </div>
              )}

              {skillPanel === "personality" && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-[16px] font-bold text-white">💜 Personality — Kepribadian SmartDash</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSkillPanel(null)}
                        className="rounded-lg border border-[#2E3750] px-3 py-1.5 text-[13px] text-[#94A3B8] transition-colors hover:text-[#E2E8F0]"
                      >
                        ← Kembali
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkillModal("editSoul")}
                        className="rounded-lg bg-[#F97316] px-3 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                      >
                        ✏️ Edit jiwa
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg border border-[#2E3750] bg-[#161B29] p-4 font-mono text-[12.5px] leading-relaxed text-[#A5F3FC]">
                    {SOUL_CONTENT}
                  </pre>
                  <p className="mt-3 text-[12px] italic text-[#64748B]">
                    Ini isi kepribadian (SOUL.md) sekarang. Kalau diubah, SmartDash langsung berubah karakter di semua chat.
                  </p>
                </div>
              )}

              {skillPanel === "skill" && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-[16px] font-bold text-white">🧠 Skill — Daftar Keahlian</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSkillPanel(null)}
                        className="rounded-lg border border-[#2E3750] px-3 py-1.5 text-[13px] text-[#94A3B8] transition-colors hover:text-[#E2E8F0]"
                      >
                        ← Kembali
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkillModal("addSkill")}
                        className="rounded-lg bg-[#22C55E] px-3 py-1.5 text-[13px] font-bold text-[#052E12] transition-colors hover:brightness-110"
                      >
                        + Tambah keahlian
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {skills.map((s, i) => (
                      <div
                        key={s.name + i}
                        onClick={() => {
                          setEditSkillIndex(i);
                          setNewSkillName(s.name);
                          // Kalau kategori lama bukan opsi yang dikenal (mis. "Bawaan"), fallback ke "custom"
                          const knownCats = SKILL_CATEGORIES.flatMap((g) =>
                            g.options.map((o) => o.value)
                          );
                          setNewSkillCat(knownCats.includes(s.cat) ? s.cat : "custom");
                          setNewSkillBody(s.desc);
                          setSkillModal("editSkill");
                        }}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-[#2E3750] bg-[#232A3D] px-4 py-3 transition-colors hover:border-[#F97316]/60 hover:bg-[#2A3347]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[14px] font-semibold text-white">
                            {s.name}
                            <span className="text-[11px] font-normal text-[#F97316]">✏️ klik untuk edit</span>
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#94A3B8]">{s.cat} · {s.desc}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label
                            className="relative inline-flex h-[22px] w-[40px] cursor-pointer items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={s.on}
                              onChange={() =>
                                setSkills((prev) =>
                                  prev.map((x, xi) => (xi === i ? { ...x, on: !x.on } : x))
                                )
                              }
                            />
                            <span className="absolute inset-0 rounded-full bg-[#3B4A68] transition-colors peer-checked:bg-[#22C55E]" />
                            <span className="absolute left-[3px] top-[3px] h-[16px] w-[16px] rounded-full bg-[#94A3B8] transition-transform peer-checked:translate-x-[18px] peer-checked:bg-white" />
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSkills((prev) => prev.filter((_, xi) => xi !== i));
                            }}
                            className="rounded-md border border-[#EF4444] px-2.5 py-1 text-[12px] text-[#EF4444] transition-colors hover:bg-[#EF4444] hover:text-white"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] italic text-[#64748B]">
                    Data contoh — di versi asli, daftar diambil dari folder skills/ Hermes. Keahlian custom (mis. &quot;Resep konten TikTok viral&quot;) muncul di sini.
                  </p>
                </div>
              )}

              {skillPanel === "memories" && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-[16px] font-bold text-white">📝 Memories — Catatan SmartDash</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSkillPanel(null)}
                        className="rounded-lg border border-[#2E3750] px-3 py-1.5 text-[13px] text-[#94A3B8] transition-colors hover:text-[#E2E8F0]"
                      >
                        ← Kembali
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkillModal("addMemory")}
                        className="rounded-lg bg-[#22C55E] px-3 py-1.5 text-[13px] font-bold text-[#052E12] transition-colors hover:brightness-110"
                      >
                        + Tambah catatan
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {memories.map((m, i) => (
                      <div
                        key={m.text + i}
                        onClick={() => {
                          setEditMemoryIndex(i);
                          setNewMemoryText(m.text);
                          setSkillModal("editMemory");
                        }}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-[#2E3750] bg-[#232A3D] px-4 py-3 transition-colors hover:border-[#F97316]/60 hover:bg-[#2A3347]"
                      >
                        <div className="flex min-w-0 items-center gap-2 text-[14px] text-[#E2E8F0]">
                          <span>{m.text}</span>
                          <span className="shrink-0 text-[11px] text-[#F97316]">✏️ klik untuk edit</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label
                            className="relative inline-flex h-[22px] w-[40px] cursor-pointer items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={m.on}
                              onChange={() =>
                                setMemories((prev) =>
                                  prev.map((x, xi) => (xi === i ? { ...x, on: !x.on } : x))
                                )
                              }
                            />
                            <span className="absolute inset-0 rounded-full bg-[#3B4A68] transition-colors peer-checked:bg-[#22C55E]" />
                            <span className="absolute left-[3px] top-[3px] h-[16px] w-[16px] rounded-full bg-[#94A3B8] transition-transform peer-checked:translate-x-[18px] peer-checked:bg-white" />
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemories((prev) => prev.filter((_, xi) => xi !== i));
                            }}
                            className="rounded-md border border-[#EF4444] px-2.5 py-1 text-[12px] text-[#EF4444] transition-colors hover:bg-[#EF4444] hover:text-white"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[12px] italic text-[#64748B]">
                    Setiap catatan = fakta yang selalu diingat SmartDash. Misal: &quot;User suka bahasa santai&quot;, &quot;Deadline konten tiap Jumat&quot;.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Fallback tab lain (tidak terpakai — semua tab sudah punya konten) */
          <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-[#2E3750] bg-[#1C222B]">
            <h2 className="text-[16px] font-bold text-white">{activeTab}</h2>
            <p className="text-[13px] text-[#94A3B8]">Segera hadir</p>
          </div>
        )}
      </div>

      {/* ===== Modal Skill — Tambah Keahlian / Edit Jiwa / Tambah Catatan ===== */}
      {skillModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setSkillModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {skillModal === "addSkill" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">➕ Keahlian baru</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup tambah skill"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Nama keahlian</label>
                    <input
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="cth: Resep konten TikTok viral"
                      className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Kategori</label>
                    <select
                      value={newSkillCat}
                      onChange={(e) => setNewSkillCat(e.target.value)}
                      className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none focus:border-[#F97316]"
                    >
                      {SKILL_CATEGORIES.map((g) => (
                        <optgroup key={g.group} label={g.group}>
                          {g.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="custom">custom (milik sendiri)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi keahlian (cara / langkah / contoh)</label>
                    <textarea
                      value={newSkillBody}
                      onChange={(e) => setNewSkillBody(e.target.value)}
                      placeholder={"# Resep konten TikTok viral\n\n1. Hook 2 detik pertama...\n2. ..."}
                      className="min-h-[120px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 font-mono text-[12.5px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const name = newSkillName.trim();
                        if (!name) return;
                        const cat = newSkillCat === "custom" ? "Milikmu" : newSkillCat;
                        setSkills((prev) => [...prev, { name, desc: "Keahlian baru (contoh)", on: true, cat }]);
                        setNewSkillName("");
                        setNewSkillBody("");
                        setSkillModal(null);
                      }}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan keahlian
                    </button>
                  </div>
                </div>
              </>
            )}

            {skillModal === "editSoul" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">💜 Edit kepribadian</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup edit jiwa"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi SOUL.md (kepribadian &amp; aturan main)</label>
                    <textarea
                      value={editSoulText}
                      onChange={(e) => setEditSoulText(e.target.value)}
                      className="min-h-[220px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 font-mono text-[12.5px] leading-relaxed text-[#A5F3FC] outline-none focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan jiwa
                    </button>
                  </div>
                </div>
              </>
            )}

            {skillModal === "addMemory" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">📝 Catatan ingatan baru</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup tambah catatan"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi catatan</label>
                    <textarea
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      placeholder="cth: User suka dibalas singkat & santai"
                      className="min-h-[100px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = newMemoryText.trim();
                        if (!text) return;
                        setMemories((prev) => [...prev, { text, on: true }]);
                        setNewMemoryText("");
                        setSkillModal(null);
                      }}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan catatan
                    </button>
                  </div>
                </div>
              </>
            )}

            {skillModal === "editSkill" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">✏️ Edit keahlian</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup edit skill"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Nama keahlian</label>
                    <input
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="cth: Resep konten TikTok viral"
                      className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Kategori</label>
                    <select
                      value={newSkillCat}
                      onChange={(e) => setNewSkillCat(e.target.value)}
                      className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none focus:border-[#F97316]"
                    >
                      {SKILL_CATEGORIES.map((g) => (
                        <optgroup key={g.group} label={g.group}>
                          {g.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="custom">custom (milik sendiri)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi keahlian (cara / langkah / contoh)</label>
                    <textarea
                      value={newSkillBody}
                      onChange={(e) => setNewSkillBody(e.target.value)}
                      placeholder={"# Resep konten TikTok viral\n\n1. Hook 2 detik pertama...\n2. ..."}
                      className="min-h-[120px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 font-mono text-[12.5px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editSkillIndex === null) return;
                        const name = newSkillName.trim();
                        if (!name) return;
                        const cat = newSkillCat === "custom" ? "Milikmu" : newSkillCat;
                        setSkills((prev) =>
                          prev.map((x, xi) =>
                            xi === editSkillIndex
                              ? { ...x, name, cat, desc: newSkillBody.trim() }
                              : x
                          )
                        );
                        setEditSkillIndex(null);
                        setNewSkillName("");
                        setNewSkillBody("");
                        setSkillModal(null);
                      }}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan perubahan
                    </button>
                  </div>
                </div>
              </>
            )}

            {skillModal === "editMemory" && (
              <>
                <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                  <h2 className="text-[15px] font-bold text-white">✏️ Edit catatan</h2>
                  <button
                    type="button"
                    onClick={() => setSkillModal(null)}
                    className="text-[#94A3B8] transition-colors hover:text-white"
                    aria-label="Tutup edit catatan"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1 block text-[12px] text-[#94A3B8]">Isi catatan</label>
                    <textarea
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      placeholder="cth: User suka dibalas singkat & santai"
                      className="min-h-[100px] w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#F97316]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSkillModal(null)}
                      className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] transition-colors hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editMemoryIndex === null) return;
                        const text = newMemoryText.trim();
                        if (!text) return;
                        setMemories((prev) =>
                          prev.map((x, xi) => (xi === editMemoryIndex ? { ...x, text } : x))
                        );
                        setEditMemoryIndex(null);
                        setNewMemoryText("");
                        setSkillModal(null);
                      }}
                      className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110"
                    >
                      Simpan perubahan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== Modal "Add Event" — muncul saat klik tanggal di Month view ===== */}
      {eventModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setEventModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: title + subtitle + X */}
            <div className="flex items-start justify-between border-b border-[#2E3750] px-4 py-3">
              <div>
                <h2 className="text-[15px] font-bold text-white">Add Event</h2>
                <p className="mt-0.5 text-[12px] text-[#94A3B8]">Fill in to create a new event</p>
              </div>
              <button
                type="button"
                onClick={() => setEventModalOpen(false)}
                aria-label="Tutup add event"
                className="flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#2A3347] hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-4">
              {/* Event Title */}
              <div className="mb-3">
                <label className="mb-1 block text-[12px] font-semibold text-white">Event Title</label>
                <input
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Meeting, Deadline, Party…"
                  className="h-9 w-full rounded-lg border border-[#60A5FA]/50 bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>

              {/* Start Date */}
              <div className="mb-3">
                <label className="mb-1 block text-[12px] font-semibold text-white">Start Date</label>
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <input
                    type="date"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#60A5FA]/50 bg-[#0E1116] pl-8 pr-2 text-[13px] text-[#E2E8F0] focus:border-[#8B5CF6] focus:outline-none"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="mb-4">
                <label className="mb-1 block text-[12px] font-semibold text-white">End Date</label>
                <div className="relative">
                  <svg
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <input
                    type="date"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#60A5FA]/50 bg-[#0E1116] pl-8 pr-2 text-[13px] text-[#E2E8F0] focus:border-[#8B5CF6] focus:outline-none"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* Event Color */}
              <div>
                <h3 className="text-[13px] font-semibold text-white">Event Color</h3>
                <div className="mt-2 flex gap-2">
                  {EVENT_COLORS.map((c) => {
                    const selected = eventColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEventColor(c)}
                        aria-label={`Warna event ${c}`}
                        className={`relative flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                          selected ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#1C222B]" : ""
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {selected && (
                          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buttons — kanan bawah */}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="rounded-lg border border-[#F87171] bg-[#1C222B] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-[#EF4444]/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEvent}
                  className="rounded-lg bg-[#4F46E5] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-[#4338CA]"
                >
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal "Hapus Event" — konfirmasi sebelum hapus (trash icon di 4 view) ===== */}
      {deleteEventId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={cancelDeleteEvent}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[#2E3750] bg-[#1C222B] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-[15px] font-bold text-white">Hapus Event</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#94A3B8]">
              Yakin ingin menghapus event ini? Aksi ini tidak bisa dibatalkan.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDeleteEvent}
                className="rounded-lg border border-[#2E3750] bg-[#232A3D] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2A3347]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteEvent}
                className="rounded-lg bg-[#EF4444] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-[#DC2626]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal "Add New Note" — muncul saat klik Add Note di tab Notes ===== */}
      {noteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setNoteModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: title + X */}
            <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
              <h2 className="text-[15px] font-bold text-white">Add New Note</h2>
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                aria-label="Tutup add note"
                className="flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#2A3347] hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-4">
              {/* Nama note */}
              <div className="mb-3">
                <label className="mb-1 block text-[12px] font-semibold text-white">Name</label>
                <input
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Nama note…"
                  className="h-9 w-full rounded-lg border border-[#3D4A63] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
                />
              </div>

              {/* Textarea */}
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write your note here.."
                rows={6}
                className="w-full resize-y rounded-lg border border-[#3D4A63] bg-[#0E1116] px-3 py-2 text-[13px] text-[#E2E8F0] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none"
              />

              {/* Change Note Color */}
              <div className="mt-4">
                <h3 className="text-[13px] font-semibold text-white">Change Note Color</h3>
                <div className="mt-2 flex gap-2">
                  {NOTE_COLORS.map((c) => {
                    const selected = newNoteColor === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewNoteColor(c)}
                        aria-label={`Warna catatan ${c}`}
                        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                          selected
                            ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#1C222B]"
                            : ""
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {selected && (
                          <svg
                            className="h-4 w-4 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer: Close + Save */}
            <div className="flex items-center justify-end gap-2 border-t border-[#2E3750] px-4 py-3">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="rounded-lg border border-white/80 bg-[#232A3D] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:bg-[#2A3347]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={saveNewNote}
                className="rounded-lg border border-[#3D4A63] bg-[#3B82F6] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Compose Mail modal — muncul saat klik Compose di tab Email ===== */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setComposeOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: title + X */}
            <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
              <h2 className="text-[15px] font-bold text-white">Compose Mail</h2>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                aria-label="Tutup compose"
                className="flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#2A3347] hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3 px-4 py-4">
              {/* To */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-white">To</label>
                <input
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="alamat@email.com"
                  className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-white">Subject</label>
                <input
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subjek email"
                  className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-white">Message</label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Tulis pesan…"
                  rows={5}
                  className="w-full resize-y rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {/* Attachment */}
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-white">Attachment</label>
                <div className="flex h-9 items-center gap-2 rounded-lg border border-[#2E3750] bg-[#0E1116] px-3">
                  <label className="cursor-pointer text-[12px] font-semibold text-[#3B82F6] hover:underline">
                    Choose file
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setComposeFile(e.target.files?.[0]?.name ?? "")}
                    />
                  </label>
                  <span className="truncate text-[12px] text-[#94A3B8]">
                    {composeFile ? composeFile : "No file chosen"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer: Send + Cancel */}
            <div className="flex items-center justify-end gap-2 border-t border-[#2E3750] px-4 py-3">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-lg bg-[#EF4444] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-lg bg-[#3B82F6] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Item sesi di sidebar kiri — tombol pilih + menu ⋮ (Rename / Pin-Unpin) ===== */
function SessionItem({
  session,
  active,
  menuOpen,
  renaming,
  renameValue,
  onRenameValue,
  onSelect,
  onMenu,
  onRename,
  onFinishRename,
  onCancelRename,
  onPin,
  onDelete,
}: {
  session: Session;
  active: boolean;
  menuOpen: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameValue: (v: string) => void;
  onSelect: () => void;
  onMenu: () => void;
  onRename: () => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative mb-1">
      {renaming ? (
        /* Mode rename inline — Enter/blur untuk simpan, Esc batal */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onFinishRename();
          }}
          className="flex items-center rounded-lg bg-[#232A3D] px-2 py-1"
        >
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameValue(e.target.value)}
            onBlur={onFinishRename}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancelRename();
            }}
            className="w-full bg-transparent text-[13px] text-white focus:outline-none"
          />
        </form>
      ) : (
        <div
          className={`flex items-center rounded-lg ${
            active ? "bg-[#3B82F6]/25" : "hover:bg-[#232A3D]"
          }`}
        >
          <button
            type="button"
            onClick={onSelect}
            className={`flex-1 truncate px-3 py-2 text-left text-[13px] ${
              active ? "font-semibold text-white" : "text-[#94A3B8] hover:text-[#E2E8F0]"
            }`}
          >
            {session.title}
          </button>

          {/* Menu ⋮ — muncul saat hover / saat menu terbuka */}
          <button
            type="button"
            onClick={onMenu}
            aria-label={`Menu sesi ${session.title}`}
            className={`mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#94A3B8] transition-opacity hover:bg-[#2A3347] hover:text-white ${
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="1.4" />
              <circle cx="12" cy="12" r="1.4" />
              <circle cx="19" cy="12" r="1.4" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-2 top-full z-20 w-32 rounded-lg border border-[#2E3750] bg-[#232A3D] p-1 shadow-xl">
              <button
                type="button"
                onClick={onRename}
                className="block w-full rounded-md px-3 py-1.5 text-left text-[12px] text-[#E2E8F0] hover:bg-[#2A3347]"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={onPin}
                className="block w-full rounded-md px-3 py-1.5 text-left text-[12px] text-[#E2E8F0] hover:bg-[#2A3347]"
              >
                {session.pinned ? "Unpin" : "Pin"}
              </button>
              {/* Divider tipis + Delete (merah — aksi bahaya) */}
              <div className="my-1 h-px bg-[#2E3750]" />
              <button
                type="button"
                onClick={onDelete}
                className="block w-full rounded-md px-3 py-1.5 text-left text-[12px] text-[#EF4444] hover:bg-[#EF4444]/10"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
