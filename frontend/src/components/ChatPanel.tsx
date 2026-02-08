import { FormEvent, useRef, useEffect, useState } from "react";
import { Send, Volume2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { useChat } from "../hooks/useChat";
import { useVoice } from "../hooks/useVoice";
import type { AgentStep } from "../types";

export default function ChatPanel() {
  const { messages, loading, send, clear } = useChat();
  const { speaking, speak, stop } = useVoice();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    send(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">AI Assistant</h3>
        <button
          onClick={clear}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Clear chat"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-8">
            Ask anything about Ghana&apos;s healthcare facilities…
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
              msg.role === "user"
                ? "ml-auto bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-800"
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>

            {/* Agent trace (collapsed) */}
            {msg.agent_trace && msg.agent_trace.length > 0 && (
              <TraceAccordion trace={msg.agent_trace} />
            )}

            {/* TTS button */}
            {msg.role === "assistant" && (
              <button
                onClick={() => (speaking ? stop() : speak(msg.content))}
                className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600"
              >
                <Volume2 size={12} />
                {speaking ? "Stop" : "Listen"}
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about facilities, coverage, deserts…"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-emerald-600 p-2 text-white disabled:opacity-40 hover:bg-emerald-700"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

/* ── Trace accordion ──────────────────────────────────────────────────────── */

function TraceAccordion({ trace }: { trace: AgentStep[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 border-t border-slate-200 pt-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        Agent trace ({trace.length} steps)
      </button>
      {open && (
        <ul className="mt-1 space-y-1 text-xs text-slate-500">
          {trace.map((s) => (
            <li key={s.step_number} className="flex gap-2">
              <span className="font-mono text-slate-400">#{s.step_number}</span>
              <span className="font-medium text-slate-600">{s.agent_name}</span>
              <span>{s.action}</span>
              {s.duration_ms != null && (
                <span className="text-slate-400">{s.duration_ms}ms</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
