import { streamingNote } from "./parse.ts";
import { MODEL } from "./prompt.ts";

type ModelMessage = { role: "system" | "user" | "assistant"; content: string };

export async function streamModel(
  ai: Ai,
  messages: ModelMessage[],
  onText: (full: string) => void,
): Promise<string> {
  const result = await ai.run(MODEL, {
    messages,
    stream: true,
    max_tokens: 4096,
    temperature: 0.4,
    chat_template_kwargs: { enable_thinking: false },
  });

  if (isTextResult(result)) {
    onText(result.response);
    return result.response;
  }

  if (!(result instanceof ReadableStream)) {
    throw new Error("模型没有返回可读取的结果");
  }

  const reader = result.getReader();
  const decoder = new TextDecoder();
  let carry = "";
  let full = "";
  let raw = "";

  const push = (token: string) => {
    if (!token) return;
    full = token.startsWith(full) ? token : full + token;
    onText(full);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decodeChunk(decoder, value);
    raw += chunk;
    carry += chunk;
    const lines = carry.split(/\r?\n/);
    carry = lines.pop() ?? "";
    for (const line of lines) push(tokenFromLine(line));
  }

  const tail = tokenFromLine(carry);
  if (tail) push(tail);
  if (!full.trim()) {
    console.log(JSON.stringify({ event: "ai-empty", raw: raw.slice(0, 1200) }));
    throw new Error("模型没有返回内容");
  }
  return full;
}

export function noteDelta(previous: string, full: string): string {
  const next = streamingNote(full);
  if (next.startsWith(previous)) return next.slice(previous.length);
  return next;
}

function tokenFromLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(":") || trimmed === "[DONE]") return "";
  const payload = trimmed.startsWith("data:") ? trimmed.slice(5).trim() : trimmed;
  if (!payload || payload === "[DONE]") return "";
  try {
    return tokenFromPayload(JSON.parse(payload) as AiChunk);
  } catch {
    return "";
  }
}

type AiChunk = {
  response?: unknown;
  delta?: unknown;
  choices?: { delta?: { content?: unknown }; message?: { content?: unknown } }[];
};

function tokenFromPayload(json: AiChunk): string {
  if (typeof json.response === "string") return json.response;
  if (typeof json.delta === "string") return json.delta;
  const choice = json.choices?.[0];
  const content = choice?.delta?.content ?? choice?.message?.content;
  return typeof content === "string" ? content : "";
}

function decodeChunk(decoder: TextDecoder, value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Uint8Array) return decoder.decode(value, { stream: true });
  return "";
}

function isTextResult(value: unknown): value is { response: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "response" in value &&
    typeof value.response === "string"
  );
}
