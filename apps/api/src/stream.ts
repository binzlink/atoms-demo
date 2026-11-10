import type { StreamEvent } from "@atoms/shared";
import { errorText, log } from "./http.ts";
import { generationPhase, streamingNote } from "./parse.ts";

const PHASE_LABEL = {
  explain: "正在写说明",
  write: "正在编写页面",
} as const;

export function eventStream(run: (emit: (event: StreamEvent) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await run(emit);
      } catch (error) {
        log("generate", { ok: false, message: errorText(error) });
        emit({ type: "error", message: "生成失败，请再试一次" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache" },
  });
}

export function noteDeltas(emit: (event: StreamEvent) => void, opening: string) {
  let previous = "";
  let activity = "";
  const setActivity = (text: string) => {
    if (activity === text) return;
    activity = text;
    emit({ type: "status", text });
  };
  return (full: string) => {
    const phase = generationPhase(full);
    setActivity(phase === "understand" ? opening : PHASE_LABEL[phase]);
    const note = streamingNote(full);
    const delta = note.startsWith(previous) ? note.slice(previous.length) : note;
    previous = note;
    if (delta) emit({ type: "delta", text: delta });
  };
}
