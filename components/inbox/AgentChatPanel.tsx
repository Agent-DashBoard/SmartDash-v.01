"use client";

// AgentChatPanel — panel kanan chat: header sesi, messages, input form.
import ReactMarkdown from "react-markdown";
import { AGENT_SIDEBAR_W, type Msg, type AgentSession } from "./inbox-types";

function MarkdownRenderer({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        code: ({ children }) => (
          <code className="rounded bg-[#0E1116] px-1 py-0.5 text-[12px] text-[#FBBF24]">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-lg bg-[#0E1116] p-3 text-[12px] text-[#E2E8F0]">{children}</pre>
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

export function AgentChatPanel({
  sessions,
  activeSessionId,
  messages,
  input,
  loading,
  onInputChange,
  onSubmit,
}: {
  sessions: AgentSession[];
  activeSessionId: number;
  messages: Msg[];
  input: string;
  loading: boolean;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const activeData = sessions.find((s) => s.id === activeSessionId);

  return (
    <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-[10px] border border-[#2E3750] bg-[#1C222B] lg:min-h-0 lg:min-w-0 lg:flex-1">
      {/* Header sesi aktif */}
      <div className="border-b border-[#2E3750] px-4 py-2.5">
        <p className="truncate text-[13px] font-bold text-white">
          {activeData?.title ?? "Pilih sesi"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-[12px] text-[#64748B]">
            Belum ada pesan. Mulai ketik di bawah.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex max-w-[80%] flex-col ${
                m.role === "user" ? "ml-auto items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-[14px] px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#38BDF8]/15 text-white"
                    : m.role === "error"
                    ? "rounded-[8px] bg-[#EF4444]/15 text-[#FCA5A5]"
                    : "bg-[#1C222B] text-white"
                }`}
              >
                {m.role === "error" ? (
                  <span className="whitespace-pre-wrap">{m.text}</span>
                ) : m.role === "agent" ? (
                  <MarkdownRenderer text={m.text} />
                ) : (
                  <span className="whitespace-pre-wrap">{m.text}</span>
                )}
              </div>
              {i === messages.length - 1 && loading && m.role === "user" && (
                <span className="mt-2 text-[11px] text-[#64748B]">
                  SmartDash lagi mikir...
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-[#2E3750] p-3">
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const ev = new Event("submit", { cancelable: true, bubbles: true });
              e.currentTarget.form?.dispatchEvent(ev);
            }
          }}
          rows={1}
          autoFocus
          placeholder="Ketik pesan..."
          className="min-h-[36px] flex-1 resize-none rounded-[8px] border border-[#2E3750] bg-[#0E1116] px-3 py-1.5 text-[13px] text-white outline-none placeholder:text-white/40 focus:border-[#38BDF8]/60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-[#38BDF8] text-[#0E1116] transition-colors ${
            loading || !input.trim()
              ? "cursor-not-allowed opacity-50"
              : "hover:brightness-110"
          }`}
          aria-label="Kirim"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </form>
    </section>
  );
}
