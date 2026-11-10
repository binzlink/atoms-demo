import { useEffect, useRef } from "react";
import type { ChatMessage } from "@atoms/shared";
import { useTypewriter } from "../hooks/useTypewriter";

export function ChatThread({ messages, pending, draft, status }: { messages: ChatMessage[]; pending: boolean; draft: string; status: string }) {
  const threadRef = useRef<HTMLDivElement>(null);
  const typed = useTypewriter(draft, pending);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages.length, typed, status]);

  return (
    <div className="flex flex-col gap-3.5 overflow-auto p-4.5" ref={threadRef}>
      {messages.map((message) => (
        <article key={message.id} className="grid gap-1">
          <span className="text-xs text-black/55">{message.role === "user" ? "你" : "生成"}</span>
          <p className={message.role === "user" ? "rounded-2xl bg-accent/10 px-3 py-2.5 whitespace-pre-wrap text-pretty" : "whitespace-pre-wrap text-pretty"}>{message.content}</p>
        </article>
      ))}
      {pending ? (
        <article className="grid gap-1" aria-live="polite">
          <span className="text-xs text-black/55">生成</span>
          {status ? <p className="text-sm text-accent">{status}</p> : null}
          <p className="whitespace-pre-wrap text-pretty">
            {typed}
            <span className="ml-0.5 inline-block h-[1.05em] w-0.5 translate-y-px bg-accent align-text-bottom animate-pulse" />
          </p>
        </article>
      ) : null}
    </div>
  );
}
