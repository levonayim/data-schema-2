import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import type { ChatMessage } from "../types";

const SUGGESTIONS = [
  "Find entities with no connections",
  "Suggest a relationship for applicant",
  "Rename newAccountApplication",
  "Fix duplicate field names",
];

export default function AIAssistPanel() {
  const chat = useStore((s) => s.chat);
  const sendChat = useStore((s) => s.sendChat);
  const regenerateLast = useStore((s) => s.regenerateLast);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length]);

  const submit = () => {
    if (!value.trim()) return;
    sendChat(value);
    setValue("");
  };

  const flashToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };

  const copy = (m: ChatMessage) => {
    navigator.clipboard?.writeText(m.text).catch(() => {});
    flashToast("Copied");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkle />
          <span className="font-semibold text-[14px]" style={{ color: "var(--text-primary)" }}>
            AI Assist
          </span>
        </div>
        <p className="text-[12.5px]" style={{ color: "var(--text-tertiary)" }}>
          Ask me to review, fix, or reshape this schema.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 space-y-3">
        {chat.map((m, i) => {
          const isLastAssistant = m.role === "assistant" && i === chat.length - 1;
          return (
            <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className="max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                style={{
                  background: m.role === "user" ? "var(--accent-blue)" : "var(--bg-surface-2)",
                  color: m.role === "user" ? "#fff" : "var(--text-primary)",
                  border: m.role === "user" ? "none" : "1px solid var(--border)",
                }}
              >
                {m.text}
                {m.table && (
                  <div className="overflow-x-auto mt-2.5 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr style={{ background: "var(--bg-hover)" }}>
                          {m.table.headers.map((h) => (
                            <th key={h} className="text-left font-semibold px-2.5 py-1.5" style={{ color: "var(--text-primary)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {m.table.rows.map((row, ri) => (
                          <tr key={ri} className="border-t" style={{ borderColor: "var(--border)" }}>
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-2.5 py-1.5" style={{ color: "var(--text-secondary)" }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {m.role === "assistant" && (
                <div className="flex items-center gap-1 mt-1 px-1">
                  <MiniBtn title="Good response" active={feedback[m.id] === "up"} onClick={() => setFeedback((f) => ({ ...f, [m.id]: "up" }))}>
                    👍
                  </MiniBtn>
                  <MiniBtn title="Bad response" active={feedback[m.id] === "down"} onClick={() => setFeedback((f) => ({ ...f, [m.id]: "down" }))}>
                    👎
                  </MiniBtn>
                  <MiniBtn title="Copy" onClick={() => copy(m)}>
                    ⧉
                  </MiniBtn>
                  {isLastAssistant && (
                    <MiniBtn title="Regenerate" onClick={regenerateLast}>
                      ↻
                    </MiniBtn>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="text-[11.5px] rounded-full px-2.5 py-1 border"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            onClick={() => sendChat(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {toast && (
        <p className="px-4 pb-1 text-[11.5px]" style={{ color: "var(--text-tertiary)" }}>
          {toast}
        </p>
      )}

      <div className="p-3 pt-0">
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)" }}
        >
          <button
            title="Voice input"
            onClick={() => flashToast("Voice input isn't available in this preview.")}
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ color: "var(--text-tertiary)" }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="4.5" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <path d="M2.5 6.5a4 4 0 008 0M6.5 10.5v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Ask AI Assist..."
            className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            onClick={submit}
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-blue)" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L10 2M10 2H4M10 2V8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniBtn({ children, title, onClick, active }: { children: React.ReactNode; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-6 h-6 rounded-md flex items-center justify-center text-[11px]"
      style={{ background: active ? "var(--bg-hover)" : "transparent", color: "var(--text-tertiary)" }}
    >
      {children}
    </button>
  );
}

export function Sparkle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1L9.4 6.6L15 8L9.4 9.4L8 15L6.6 9.4L1 8L6.6 6.6L8 1Z"
        fill="url(#spark-grad)"
      />
      <defs>
        <linearGradient id="spark-grad" x1="1" y1="1" x2="15" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c9cff" />
          <stop offset="1" stopColor="#c47bff" />
        </linearGradient>
      </defs>
    </svg>
  );
}
