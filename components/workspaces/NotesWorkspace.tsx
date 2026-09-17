"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Note = {
  id: number;
  title: string;
  body: string;
  date: string;
  color: string;
};

const NOTE_COLORS = ["#FACC15", "#3B82F6", "#EF4444", "#10B981", "#60A5FA"];

function todayStr() {
  return new Date().toLocaleDateString("en-GB");
}

export function NotesWorkspace() {
  // Hydration-safe: init selalu kosong (server & client sama), baru baca localStorage SETELAH mount.
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(0);
  const [notesSearch, setNotesSearch] = useState("");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteColor, setNewNoteColor] = useState(NOTE_COLORS[1]);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [noteEditing, setNoteEditing] = useState(false);
  // Auto: kalau note ada isi (body panjang) → preview mode; kalau kosong → langsung edit
  useEffect(() => {
    setNoteEditing(false);
  }, [activeNoteId]);

  // Setelah mount: baca simpanan user dari localStorage (kalau ada)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("smartdash-notes");
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) {
          setNotes(p);
          const first = p[0]?.id;
          if (first != null && !p.some((n: Note) => n.id === activeNoteId)) setActiveNoteId(first);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Simpan ke localStorage setiap ganti — skip saat mount (hydrated masih false)
  // biar gak nimpa simpanan user dengan state kosong
  useEffect(() => {
    if (hydrated) {
      try { window.localStorage.setItem("smartdash-notes", JSON.stringify(notes)); } catch {}
    }
  }, [notes, hydrated]);

  const filteredNotes = notes.filter(n => `${n.title} ${n.body}`.toLowerCase().includes(notesSearch.toLowerCase()));
  const activeNote = notes.find(n => n.id === activeNoteId) ?? null;

  function openAddNote() { setNewNoteTitle(""); setNewNoteText(""); setNewNoteColor(NOTE_COLORS[1]); setNoteModalOpen(true); }
  function saveNewNote() {
    const title = newNoteTitle.trim();
    const nextId = Math.max(0, ...notes.map(n => n.id)) + 1;
    const note: Note = { id: nextId, title: title || newNoteText.split("\n")[0].slice(0, 40) || "New Note", body: newNoteText, date: todayStr(), color: newNoteColor };
    setNotes(prev => [note, ...prev]);
    setActiveNoteId(nextId);
    setNoteModalOpen(false);
  }
  function handleDeleteNote(id: number) {
    const next = notes.filter(n => n.id !== id);
    if (id === activeNoteId) setActiveNoteId(next[0]?.id ?? 0);
    setNotes(next);
  }
  function handleNoteField(id: number, field: "title" | "body", value: string) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  }
  function handleNoteColor(color: string) {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, color } : n));
  }

  return (
    <section className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[#2E3750] bg-[#1C222B]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[#2E3750] bg-[#0E1116]">
        <div className="border-b border-[#2E3750] p-3">
          <input value={notesSearch} onChange={e => setNotesSearch(e.target.value)} placeholder="Search Notes" className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#8B5CF6] focus:outline-none" />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-white">All Notes</p>
          {filteredNotes.length === 0 ? (
            <p className="px-2 py-1 text-[12px] text-[#64748B]">Tidak ada catatan.</p>
          ) : filteredNotes.map(n => {
            const active = n.id === activeNoteId;
            return (
              <div key={n.id} className="group relative mb-2 overflow-hidden rounded-lg border px-3 py-2" style={{ backgroundColor: n.color + (active ? "33" : "1A"), borderColor: active ? n.color : "transparent" }}>
                <button type="button" onClick={() => setActiveNoteId(n.id)} className="block w-full pr-6 text-left">
                  <p className="truncate text-[13px] font-semibold text-white">{n.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#94A3B8]">{n.date}</p>
                </button>
                <button type="button" onClick={() => handleDeleteNote(n.id)} aria-label={`Hapus catatan ${n.title}`} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[#94A3B8] transition-colors hover:bg-[#EF4444]/20 hover:text-[#EF4444]">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header — SELALU tampil (ada/tidak ada note) */}
        <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3 shrink-0">
          <h2 className="text-[15px] font-bold text-white">Edit Note</h2>
          <button type="button" onClick={openAddNote} className="rounded-lg bg-[#8B5CF6] px-4 py-1.5 text-[13px] font-bold text-white transition-colors hover:brightness-110">Add Note</button>
        </div>
        {activeNote ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Content area — SCROLL DI SINI SAJA */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <div className="relative rounded-xl border border-[#3D4A63] bg-[#0E1116] p-3.5 h-full flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <input value={activeNote.title} onChange={e => handleNoteField(activeNote.id, "title", e.target.value)} placeholder="Judul catatan" className="w-full bg-transparent text-[14px] font-bold text-white placeholder:text-[#64748B] focus:outline-none" />
                  {/* Toggle Preview/Edit */}
                  <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#232A3D] p-0.5">
                    <button type="button" onClick={() => setNoteEditing(false)} className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${!noteEditing ? "bg-[#3D4A63] text-white" : "text-[#94A3B8] hover:text-white"}`}>Preview</button>
                    <button type="button" onClick={() => setNoteEditing(true)} className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${noteEditing ? "bg-[#3D4A63] text-white" : "text-[#94A3B8] hover:text-white"}`}>Edit</button>
                  </div>
                </div>
                <div className="mt-2 flex min-h-0 flex-1 flex-col">
                  {noteEditing ? (
                    <textarea value={activeNote.body} onChange={e => handleNoteField(activeNote.id, "body", e.target.value)} placeholder="Tulis catatan…" className="w-full flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-white placeholder:text-[#64748B] focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" />
                  ) : (
                    <div className="prose prose-sm min-h-0 flex-1 overflow-y-auto max-w-none text-[13px] leading-relaxed text-[#E2E8F0] w-full">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="mb-2 mt-1 text-[20px] font-bold text-white">{children}</h1>,
                          h2: ({ children }) => <h2 className="mb-2 mt-3 text-[17px] font-bold text-white">{children}</h2>,
                          h3: ({ children }) => <h3 className="mb-2 mt-2 text-[15px] font-bold text-white">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          blockquote: ({ children }) => <blockquote className="mb-2 border-l-4 border-[#8B5CF6]/50 pl-3 text-[#94A3B8]">{children}</blockquote>,
                          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
                          code: ({ children }) => <code className="rounded bg-[#1C222B] px-1 py-0.5 text-[12px] text-[#FBBF24]">{children}</code>,
                          pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-lg bg-[#1C222B] p-3 text-[12px] text-[#E2E8F0]">{children}</pre>,
                          hr: () => <hr className="my-3 border-[#2E3750]" />,
                        }}
                      >
                        {activeNote.body || "*Catatan kosong — klik Edit untuk menulis.*"}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Color picker — nempel bawah */}
            <div className="shrink-0 border-t border-[#2E3750] px-4 py-3">
              <h3 className="text-[13px] font-semibold text-white">Change Note Color</h3>
              <div className="mt-2 flex gap-2">
                {NOTE_COLORS.map(c => {
                  const selected = activeNote.color === c;
                  return <button key={c} type="button" onClick={() => handleNoteColor(c)} className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${selected ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#1C222B]" : ""}`} style={{ backgroundColor: c }} />;
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center"><p className="text-[13px] text-[#64748B]">Pilih catatan atau klik Add Note untuk membuat baru.</p></div>
        )}
        {noteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setNoteModalOpen(false)}>
            <div className="w-full max-w-md rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
                <h2 className="text-[15px] font-bold text-white">Add New Note</h2>
                <button type="button" onClick={() => setNoteModalOpen(false)} className="text-[#94A3B8] hover:text-white">✕</button>
              </div>
              <div className="space-y-3 p-4">
                <div><label className="mb-1 block text-[12px] text-[#94A3B8]">Title</label><input value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} placeholder="Note title" className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#8B5CF6]" /></div>
                <div><label className="mb-1 block text-[12px] text-[#94A3B8]">Content</label><textarea value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="Write your note here…" rows={4} className="w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#64748B] focus:border-[#8B5CF6]" /></div>
                <div><label className="mb-1 block text-[12px] text-[#94A3B8]">Color</label><div className="flex gap-2">{NOTE_COLORS.map(c => <button key={c} type="button" onClick={() => setNewNoteColor(c)} className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${newNoteColor === c ? "ring-2 ring-white/70 ring-offset-2 ring-offset-[#1C222B]" : ""}`} style={{ backgroundColor: c }} />)}</div></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setNoteModalOpen(false)} className="rounded-lg border border-[#2E3750] px-4 py-2 text-[13px] text-[#94A3B8] hover:text-white">Cancel</button>
                  <button type="button" onClick={saveNewNote} className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-[13px] font-bold text-white hover:brightness-110">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}