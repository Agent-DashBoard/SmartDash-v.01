"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────
type AgendaEvent = {
  id: number;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  title: string;
  color: string;
};

type CalView = "Month" | "Week" | "Day" | "Agenda";

// ── Constants ─────────────────────────────────────────────────────────────
const EVENT_COLORS = ["#F97316", "#8B5CF6", "#3B82F6", "#10B981", "#EF4444"];

const CAL_VIEWS: { key: CalView; label: string }[] = [
  { key: "Month", label: "Bulan" },
  { key: "Week", label: "Minggu" },
  { key: "Day", label: "Hari" },
  { key: "Agenda", label: "Agenda" },
];

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTHS_EN_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ── Helpers ───────────────────────────────────────────────────────────────
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function eventTimeLabel(time: string): string {
  if (!time) return "";
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    if (isNaN(hour)) return time;
    const suffix = hour >= 12 ? "PM" : "AM";
    const disp = hour % 12 === 0 ? 12 : hour % 12;
    return `${disp}:${m ?? "00"} ${suffix}`;
  } catch {
    return time;
  }
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday first
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatWeekRange(anchor: Date): string {
  const start = startOfWeek(anchor);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const label = sameMonth
    ? `${start.getDate()} – ${end.getDate()} ${MONTH_NAMES_ID[end.getMonth()]} ${end.getFullYear()}`
    : `${start.getDate()} ${MONTHS_EN_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES_ID[end.getMonth()]} ${end.getFullYear()}`;
  return label;
}

function formatDayTitle(d: Date): string {
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function formatAgendaDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mmdd(iso: string): string {
  const [, m, dd] = iso.split("-");
  return `${m}/${dd}`;
}

type MonthCell = { date: Date; iso: string; inMonth: boolean };

function buildMonthCells(anchor: Date): MonthCell[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    cells.push({
      date,
      iso: toISODate(date),
      inMonth: date.getMonth() === month,
    });
  }
  return cells;
}

// ── useClock hook ─────────────────────────────────────────────────────────
function useClock(): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── TrashIcon ─────────────────────────────────────────────────────────────
function TrashIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
const STORAGE_KEY = "smartdash-agenda";

export function CalendarWorkspace() {
  const now = useClock();
  const todayISO = toISODate(now);

  const [calCursor, setCalCursor] = useState<Date>(() => new Date(now));
  const [calView, setCalView] = useState<CalView>("Month");
  // Hydration-safe: init kosong (server & client sama), baca localStorage SETELAH mount.
  const [hydrated, setHydrated] = useState(false);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventColor, setEventColor] = useState(EVENT_COLORS[0]);
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Setelah mount: baca simpanan user dari localStorage (kalau ada) — hydration-safe
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) {
          // Validasi: cuma simpan item yang bentuknya AgendaEvent (anti localStorage korup/versi lama)
          const valid = p.filter(
            (e): e is AgendaEvent =>
              !!e && typeof e.id === "number" && typeof e.date === "string" && typeof e.title === "string" && typeof e.color === "string"
          );
          setAgendaEvents(valid);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // persist events — skip saat mount biar gak nimpa simpanan user dengan state kosong
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(agendaEvents));
    } catch {}
  }, [agendaEvents, hydrated]);

  // ── Navigation ────────────────────────────────────────────
  const goPrev = () => {
    const c = new Date(calCursor);
    if (calView === "Month") c.setMonth(c.getMonth() - 1);
    else if (calView === "Week") c.setDate(c.getDate() - 7);
    else if (calView === "Day") c.setDate(c.getDate() - 1);
    else c.setMonth(c.getMonth() - 1);
    setCalCursor(c);
  };

  const goNext = () => {
    const c = new Date(calCursor);
    if (calView === "Month") c.setMonth(c.getMonth() + 1);
    else if (calView === "Week") c.setDate(c.getDate() + 7);
    else if (calView === "Day") c.setDate(c.getDate() + 1);
    else c.setMonth(c.getMonth() + 1);
    setCalCursor(c);
  };

  const goToday = () => setCalCursor(new Date(now));

  const currentTitle =
    calView === "Month"
      ? `${MONTH_NAMES_ID[calCursor.getMonth()]} ${calCursor.getFullYear()}`
      : calView === "Week"
        ? formatWeekRange(calCursor)
        : calView === "Day"
          ? formatDayTitle(calCursor)
          : `${MONTH_NAMES_ID[calCursor.getMonth()]} ${calCursor.getFullYear()}`;

  // ── Event CRUD ────────────────────────────────────────────
  const openEventModal = (date?: string) => {
    setEventTitle("");
    setEventStart(date || todayISO);
    setEventEnd(date || todayISO);
    setEventColor(EVENT_COLORS[0]);
    setEventModalOpen(true);
  };

  const saveEvent = () => {
    const title = eventTitle.trim();
    if (!title || !eventStart) {
      setEventModalOpen(false);
      return;
    }
    const id = Date.now();
    const evt: AgendaEvent = {
      id,
      date: eventStart,
      time: "08:00",
      title,
      color: eventColor,
    };
    setAgendaEvents(prev => [...prev, evt]);
    setEventModalOpen(false);
  };

  const requestDeleteEvent = (id: number) => setDeleteEventId(id);
  const cancelDeleteEvent = () => setDeleteEventId(null);
  const confirmDeleteEvent = () => {
    if (deleteEventId === null) return;
    setAgendaEvents(prev => prev.filter(e => e.id !== deleteEventId));
    setDeleteEventId(null);
  };

  // events for a day
  const eventsForDay = useCallback(
    (iso: string) => agendaEvents
      .filter(e => e.date === iso)
      .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [agendaEvents],
  );

  const monthCells = buildMonthCells(calCursor);
  const weekStart = startOfWeek(calCursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedDayEvents = eventsForDay(toISODate(calCursor));

  const upcomingEvents = [...agendaEvents]
    .filter(e => e.date >= todayISO)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 30);

  const pastEvents = [...agendaEvents]
    .filter(e => e.date < todayISO)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    .slice(0, 30);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#2E3750] bg-[#1C222B]">
      {/* Control bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#2E3750] px-3 py-2">
        <button
          type="button"
          onClick={goToday}
          className="rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-1.5 text-[12px] font-semibold text-[#E2E8F0] transition-colors hover:bg-[#232A3D] hover:text-white"
        >
          Today
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2E3750] bg-[#0E1116] text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2E3750] bg-[#0E1116] text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
        <h2 className="ml-1 text-[15px] font-bold text-white">{currentTitle}</h2>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-[#2E3750] bg-[#0E1116] p-1">
          {CAL_VIEWS.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => setCalView(v.key)}
              className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition-colors ${
                calView === v.key
                  ? "bg-[#8B5CF6] text-white"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => openEventModal(todayISO)}
          className="rounded-lg bg-[#F97316] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:brightness-110"
        >
          + Event
        </button>
      </div>

      {/* View content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {calView === "Month" && (
          <div className="grid h-full grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-0.5 bg-[#2E3750] p-0.5">
            {/* column headers */}
            {DAYS_ID.map(d => (
              <div key={d} className="bg-[#11151D] px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-[#94A3B8] rounded-[8px] border border-[#2E3750]">
                {d}
              </div>
            ))}
            {monthCells.map((cell, idx) => {
              const isToday = cell.iso === todayISO;
              const dayEvents = eventsForDay(cell.iso);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openEventModal(cell.iso)}
                  className={`group flex min-h-[68px] flex-col items-stretch gap-1 bg-[#0E1116] p-1.5 text-left transition-colors hover:bg-[#1C222B] rounded-[8px] border border-[#2E3750] ${isToday ? "bg-[#262C36] border-[#F97316]" : ""}`}
                >
                                    <span className="text-[12px] font-semibold text-[#94A3B8]">
                                      {cell.date.getDate()}
                                    </span>
                  <span className="flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map(e => (
                      <span
                        key={e.id}
                        title={e.title}
                        className="inline-block truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: e.color + "66", borderLeft: `2px solid ${e.color}` }}
                      >
                        {e.time ? eventTimeLabel(e.time) : ""} {e.title}
                      </span>
                    ))}
                  </span>
                  {dayEvents.length > 3 && (
                    <span className="px-1 text-[10px] text-[#94A3B8]">+{dayEvents.length - 3} lainnya</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {calView === "Week" && (
          <div className="grid grid-cols-7 gap-px bg-[#2E3750] p-px">
            {weekDays.map((d, idx) => {
              const iso = toISODate(d);
              const isToday = iso === todayISO;
              const dayEvents = eventsForDay(iso);
              return (
                <div key={idx} className="flex min-h-[420px] flex-col bg-[#161B24]">
                  <button
                    type="button"
                    onClick={() => openEventModal(iso)}
                    className={`flex flex-col items-center gap-0.5 border-b border-[#2E3750] px-2 py-2 transition-colors hover:bg-[#1C222B] ${
                      isToday ? "" : ""
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase text-[#94A3B8]">
                      {DAYS_ID[idx]}
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${
                        isToday ? "bg-[#F97316] text-white" : "text-[#E2E8F0]"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-semibold uppercase text-[#F97316]">Hari Ini</span>
                    )}
                  </button>
                  <div className="flex-1 space-y-1 p-1.5">
                    {dayEvents.length === 0 ? (
                      <p className="px-1 pt-1 text-[11px] text-[#4A5568]">—</p>
                    ) : (
                      dayEvents.map(e => (
                        <div
                          key={e.id}
                          className="group relative cursor-pointer rounded-md px-2 py-1.5"
                          style={{ backgroundColor: e.color + "1F" }}
                          onClick={() => requestDeleteEvent(e.id)}
                          title={e.title}
                        >
                          <div
                            className="absolute inset-y-0 left-0 w-1 rounded-l-md"
                            style={{ backgroundColor: e.color }}
                          />
                          <p className="truncate pl-1.5 text-[12px] font-semibold text-white">{e.title}</p>
                          <p className="pl-1.5 text-[10px] text-[#94A3B8]">{eventTimeLabel(e.time)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {calView === "Day" && (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-white">{formatDayTitle(calCursor)}</h3>
              <button
                type="button"
                onClick={() => openEventModal(toISODate(calCursor))}
                className="rounded-lg bg-[#F97316] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:brightness-110"
              >
                + Tambah Acara
              </button>
            </div>
            {selectedDayEvents.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-[#2E3750] bg-[#161B24] py-16">
                <p className="text-[13px] text-[#64748B]">Tidak ada acara pada tanggal ini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayEvents.map(e => (
                  <div
                    key={e.id}
                    className="group flex items-center gap-3 rounded-xl border border-[#2E3750] bg-[#161B24] px-4 py-3"
                  >
                    <div className="h-10 w-1 rounded-full" style={{ backgroundColor: e.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">{e.title}</p>
                      <p className="text-[11px] text-[#94A3B8]">{eventTimeLabel(e.time)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => requestDeleteEvent(e.id)}
                      aria-label={`Hapus acara ${e.title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#EF4444]/20 hover:text-[#EF4444]"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {calView === "Agenda" && (
          <div className="p-4">
            <h3 className="mb-3 text-[15px] font-bold text-white">Agenda Mendatang</h3>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#2E3750] text-[11px] uppercase tracking-wide text-[#94A3B8]">
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Waktu</th>
                  <th className="px-3 py-2 font-semibold">Judul</th>
                  <th className="px-3 py-2 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-[13px] text-[#64748B]">
                      Tidak ada agenda mendatang. Klik “+ Event” untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  upcomingEvents.map(e => (
                    <tr key={e.id} className="border-b border-[#2E3750]/50 hover:bg-[#161B24]">
                      <td className="px-3 py-2 text-[12px] text-[#E2E8F0]">{formatAgendaDate(e.date)}</td>
                      <td className="px-3 py-2 text-[12px] text-[#94A3B8]">{eventTimeLabel(e.time)}</td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-[12px] font-semibold text-white"
                          style={{ backgroundColor: e.color + "22" }}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                          {e.title}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => requestDeleteEvent(e.id)}
                          aria-label={`Hapus acara ${e.title}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#EF4444]/20 hover:text-[#EF4444]"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {pastEvents.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 text-[15px] font-bold text-white">Agenda Lampau</h3>
                <table className="w-full border-collapse text-left opacity-60">
                  <thead>
                    <tr className="border-b border-[#2E3750] text-[11px] uppercase tracking-wide text-[#94A3B8]">
                      <th className="px-3 py-2 font-semibold">Tanggal</th>
                      <th className="px-3 py-2 font-semibold">Waktu</th>
                      <th className="px-3 py-2 font-semibold">Judul</th>
                      <th className="px-3 py-2 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastEvents.map(e => (
                      <tr key={e.id} className="border-b border-[#2E3750]/50">
                        <td className="px-3 py-2 text-[12px] text-[#E2E8F0]">{formatAgendaDate(e.date)}</td>
                        <td className="px-3 py-2 text-[12px] text-[#94A3B8]">{eventTimeLabel(e.time)}</td>
                        <td className="px-3 py-2">
                          <span
                            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-[12px] font-semibold text-white"
                            style={{ backgroundColor: e.color + "22" }}
                          >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                            {e.title}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => requestDeleteEvent(e.id)}
                            aria-label={`Hapus acara ${e.title}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#EF4444]/20 hover:text-[#EF4444]"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {eventModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setEventModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
              <h2 className="text-[15px] font-bold text-white">Tambah Acara</h2>
              <button
                type="button"
                onClick={() => setEventModalOpen(false)}
                aria-label="Tutup"
                className="flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] hover:bg-[#2A3347] hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-white">Judul</label>
                <input
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder="Nama acara"
                  autoFocus
                  className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-white">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={eventStart}
                    onChange={e => setEventStart(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] focus:border-[#F97316] focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-white">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={eventEnd}
                    onChange={e => setEventEnd(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] focus:border-[#F97316] focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-white">Warna</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEventColor(c)}
                      aria-label={`Pilih warna ${c}`}
                      className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                        eventColor === c ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#1C222B]" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#2E3750] px-4 py-3">
              <button
                type="button"
                onClick={() => setEventModalOpen(false)}
                className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEvent}
                className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-[13px] font-bold text-white hover:brightness-110"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hapus Event Modal */}
      {deleteEventId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={cancelDeleteEvent}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
              <h2 className="text-[15px] font-bold text-white">Hapus Event</h2>
              <button
                type="button"
                onClick={cancelDeleteEvent}
                aria-label="Tutup"
                className="flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] hover:bg-[#2A3347] hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="px-4 py-4">
              <p className="text-[13px] text-[#E2E8F0]">
                Apakah Anda yakin ingin menghapus acara ini? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#2E3750] px-4 py-3">
              <button
                type="button"
                onClick={cancelDeleteEvent}
                className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteEvent}
                className="rounded-lg bg-[#EF4444] px-4 py-2 text-[13px] font-bold text-white hover:brightness-110"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
