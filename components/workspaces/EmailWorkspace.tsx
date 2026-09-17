"use client";

import { useState } from "react";

export function EmailWorkspace() {
  const [emailFolder, setEmailFolder] = useState("Inbox");
  const [emailSearch, setEmailSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [composeFile, setComposeFile] = useState("");

  return (
    <>
      <section className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-[#2E3750] bg-[#1C222B]">
        <aside className="flex w-56 shrink-0 flex-col border-r border-[#2E3750] bg-[#0E1116]">
          <div className="border-b border-[#2E3750] p-3">
            <button type="button" onClick={() => setComposeOpen(true)} className="w-full rounded-lg bg-[#3B82F6] px-3 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110">Compose</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {["Inbox", "Send", "Draft", "Spam", "Trash"].map(f => (
              <button key={f} type="button" onClick={() => setEmailFolder(f)} className={`mb-1 block w-full truncate rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${f === emailFolder ? "bg-[#3B82F6]/25 font-semibold text-white" : "text-[#94A3B8] hover:bg-[#232A3D] hover:text-[#E2E8F0]"}`}>{f}</button>
            ))}
            <div className="my-2 h-px bg-[#2E3750]" />
            <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-white">Sort by</p>
            {["Starred", "Important"].map(s => (
              <button key={s} type="button" onClick={() => {}} className="mb-1 block w-full truncate rounded-lg px-3 py-2 text-left text-[13px] text-[#94A3B8] transition-colors hover:bg-[#232A3D] hover:text-[#E2E8F0]">{s}</button>
            ))}
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[#2E3750] p-3">
            <input value={emailSearch} onChange={e => setEmailSearch(e.target.value)} placeholder="Search Emails" className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none" />
          </div>
          <div className="flex flex-1 items-center justify-center p-3">
            <div className="flex h-full w-full items-center justify-center rounded-lg border border-[#2E3750]">
              <p className="text-[13px] text-[#64748B]">Tidak ada email di {emailFolder}</p>
            </div>
          </div>
        </div>
      </section>
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setComposeOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-[#2E3750] bg-[#1C222B] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#2E3750] px-4 py-3">
              <h2 className="text-[15px] font-bold text-white">Compose Mail</h2>
              <button type="button" onClick={() => setComposeOpen(false)} className="flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] hover:bg-[#2A3347] hover:text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div><label className="mb-1 block text-[12px] font-semibold text-white">To</label><input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="alamat@email.com" className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none" /></div>
              <div><label className="mb-1 block text-[12px] font-semibold text-white">Subject</label><input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Subjek email" className="h-9 w-full rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none" /></div>
              <div><label className="mb-1 block text-[12px] font-semibold text-white">Message</label><textarea value={composeMessage} onChange={e => setComposeMessage(e.target.value)} placeholder="Tulis pesan…" rows={5} className="w-full resize-y rounded-lg border border-[#2E3750] bg-[#0E1116] px-3 py-2 text-[13px] text-[#E2E8F0] placeholder:text-[#94A3B8] focus:border-[#F97316] focus:outline-none" /></div>
              <div><label className="mb-1 block text-[12px] font-semibold text-white">Attachment</label><div className="flex h-9 items-center gap-2 rounded-lg border border-[#2E3750] bg-[#0E1116] px-3"><label className="cursor-pointer text-[12px] font-semibold text-[#3B82F6] hover:underline">Choose file<input type="file" className="hidden" onChange={e => setComposeFile(e.target.files?.[0]?.name ?? "")} /></label><span className="truncate text-[12px] text-[#94A3B8]">{composeFile || "No file chosen"}</span></div></div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#2E3750] px-4 py-3">
              <button type="button" onClick={() => setComposeOpen(false)} className="rounded-lg bg-[#EF4444] px-4 py-1.5 text-[13px] font-bold text-white hover:brightness-110">Cancel</button>
              <button type="button" onClick={() => setComposeOpen(false)} className="rounded-lg bg-[#3B82F6] px-4 py-1.5 text-[13px] font-bold text-white hover:brightness-110">Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}