import type { ProjectDetail, StreamEvent } from "@atoms/shared";
import { apiUrl } from "./client";

export type StreamHandlers = {
  onDelta: (text: string) => void;
  onStatus?: (text: string) => void;
};

export async function streamGeneration(path: string, prompt: string, handlers: StreamHandlers): Promise<ProjectDetail> {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok || !response.body) throw new Error(await errorMessage(response));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  let project: ProjectDetail | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    const chunks = carry.split("\n\n");
    carry = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const event = parseEvent(chunk);
      if (!event) continue;
      if (event.type === "status") handlers.onStatus?.(event.text);
      if (event.type === "delta") handlers.onDelta(event.text);
      if (event.type === "error") throw new Error(event.message);
      if (event.type === "done") project = event.project;
    }
  }

  if (!project) throw new Error("生成中断，请再试一次");
  return project;
}

function parseEvent(chunk: string): StreamEvent | null {
  const line = chunk.split("\n").find((item) => item.startsWith("data:"));
  if (!line) return null;
  return JSON.parse(line.slice(5).trim()) as StreamEvent;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || "请求失败";
  } catch {
    return "请求失败";
  }
}
