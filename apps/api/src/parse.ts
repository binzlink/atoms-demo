const HTML_MARK = "---HTML---";

export type Generation = {
  title: string | null;
  note: string;
  html: string;
};

export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export type GenerationPhase = "understand" | "explain" | "write";

export function generationPhase(buffer: string): GenerationPhase {
  const text = stripThinking(buffer);
  if (text.includes(HTML_MARK)) return "write";
  if (streamingNote(buffer)) return "explain";
  return "understand";
}

export function streamingNote(buffer: string): string {
  const text = stripThinking(buffer);
  const { head } = splitHead(text);
  const marker = head.indexOf("NOTE:");
  if (marker === -1) return "";
  return head.slice(marker + "NOTE:".length).replace(/^\s+/, "").trimEnd();
}

export function parseGeneration(raw: string): Generation | { error: string } {
  const text = stripFences(stripThinking(raw));
  const mark = text.indexOf(HTML_MARK);
  if (mark === -1) return { error: "模型没有返回页面" };

  const head = text.slice(0, mark).trim();
  let html = stripFences(text.slice(mark + HTML_MARK.length).trim());
  if (!/<\s*(!doctype|html|body|main|section|div)/i.test(html) || !/<\/html>/i.test(html)) {
    return { error: "页面没有生成完整，请再试一次" };
  }

  const titleLine = head.match(/^TITLE:\s*(.+)$/m);
  const noteMarker = head.indexOf("NOTE:");
  const note = (noteMarker === -1 ? "" : head.slice(noteMarker + "NOTE:".length)).trim();
  const title = cleanTitle(titleLine?.[1] ?? "");

  return {
    title: title || null,
    note: note || "页面已更新",
    html,
  };
}

function splitHead(text: string): { head: string } {
  const mark = text.indexOf(HTML_MARK);
  if (mark !== -1) return { head: text.slice(0, mark) };
  for (let size = HTML_MARK.length - 1; size > 0; size -= 1) {
    if (text.endsWith(HTML_MARK.slice(0, size))) {
      return { head: text.slice(0, -size) };
    }
  }
  return { head: text };
}

function stripFences(text: string): string {
  return text.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, "").trim();
}

function cleanTitle(value: string): string {
  return value.replace(/^["'「『]+|["'」』]+$/g, "").trim().slice(0, 24);
}
