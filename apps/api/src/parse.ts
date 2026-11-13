const HTML_MARK = "---HTML---";
const PATCH_MARK = "---PATCH---";
const MARKS = [HTML_MARK, PATCH_MARK];

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
  if (MARKS.some((mark) => text.includes(mark))) return "write";
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

export function isCompleteOutput(raw: string): boolean {
  const text = stripFences(stripThinking(raw));
  const patchAt = text.indexOf(PATCH_MARK);
  const htmlAt = text.indexOf(HTML_MARK);
  if (patchAt !== -1 && (htmlAt === -1 || patchAt < htmlAt)) {
    const body = text.slice(patchAt);
    const opens = countOf(body, "<<<<<<< SEARCH");
    const closes = countOf(body, ">>>>>>> REPLACE");
    return opens > 0 && opens === closes;
  }
  if (htmlAt !== -1) return /<\/html>/i.test(text.slice(htmlAt));
  return false;
}

export function stitch(head: string, tail: string): string {
  if (/^\s*(TITLE:|<!DOCTYPE|---HTML---|---PATCH---)/i.test(tail) && isCompleteOutput(tail)) return tail;
  const max = Math.min(head.length, tail.length, 800);
  for (let size = max; size >= 16; size -= 1) {
    if (head.slice(-size) === tail.slice(0, size)) return head + tail.slice(size);
  }
  return head + tail;
}

export function resolveGeneration(raw: string, baseHtml?: string): Generation | { error: string } {
  const text = stripFences(stripThinking(raw));
  const patchAt = text.indexOf(PATCH_MARK);
  const htmlAt = text.indexOf(HTML_MARK);
  if (patchAt !== -1 && (htmlAt === -1 || patchAt < htmlAt)) {
    if (!baseHtml) return { error: "模型没有返回页面" };
    const parsed = parsePatch(text);
    if ("error" in parsed) return parsed;
    const html = applyEdits(baseHtml, parsed.edits);
    if (typeof html !== "string") return html;
    return { title: parsed.title, note: parsed.note || "页面已更新", html };
  }
  return parseGeneration(text);
}

export function applyEdits(html: string, edits: { search: string; replace: string }[]): string | { error: string } {
  let next = html;
  for (const edit of edits) {
    if (!edit.search) return { error: "修改片段是空的" };
    const at = next.indexOf(edit.search);
    if (at === -1) return { error: "没有在当前页面里找到要改的片段" };
    if (next.indexOf(edit.search, at + edit.search.length) !== -1) return { error: "要改的片段出现了不止一次" };
    next = next.slice(0, at) + edit.replace + next.slice(at + edit.search.length);
  }
  if (!/<\/html>/i.test(next)) return { error: "页面没有生成完整，请再试一次" };
  return next;
}

function parsePatch(text: string): { title: string | null; note: string; edits: { search: string; replace: string }[] } | { error: string } {
  const mark = text.indexOf(PATCH_MARK);
  const head = text.slice(0, mark).trim();
  const body = text.slice(mark + PATCH_MARK.length);
  const edits = [...body.matchAll(/<<<<<<< SEARCH\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> REPLACE/g)].map((match) => ({
    search: match[1] ?? "",
    replace: match[2] ?? "",
  }));
  if (edits.length === 0) return { error: "模型没有返回修改" };
  const titleLine = head.match(/^TITLE:\s*(.+)$/m);
  const noteMarker = head.indexOf("NOTE:");
  return {
    title: cleanTitle(titleLine?.[1] ?? "") || null,
    note: (noteMarker === -1 ? "" : head.slice(noteMarker + "NOTE:".length)).trim(),
    edits,
  };
}

function splitHead(text: string): { head: string } {
  let cut = text.length;
  for (const mark of MARKS) {
    const at = text.indexOf(mark);
    if (at !== -1) cut = Math.min(cut, at);
  }
  const head = text.slice(0, cut);
  let partial = 0;
  for (const mark of MARKS) {
    for (let size = mark.length - 1; size > partial; size -= 1) {
      if (head.endsWith(mark.slice(0, size))) partial = size;
    }
  }
  return { head: head.slice(0, head.length - partial) };
}

function countOf(text: string, needle: string): number {
  let count = 0;
  let from = 0;
  while (from <= text.length) {
    const at = text.indexOf(needle, from);
    if (at === -1) return count;
    count += 1;
    from = at + needle.length;
  }
  return count;
}

function stripFences(text: string): string {
  return text.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, "").trim();
}

function cleanTitle(value: string): string {
  return value.replace(/^["'「『]+|["'」』]+$/g, "").trim().slice(0, 24);
}
