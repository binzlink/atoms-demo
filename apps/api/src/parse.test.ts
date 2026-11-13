import assert from "node:assert/strict";
import test from "node:test";
import { applyEdits, generationPhase, isCompleteOutput, parseGeneration, resolveGeneration, stitch, streamingNote } from "./parse.ts";

const page = `<!DOCTYPE html>
<html lang="zh-CN"><body><h1>咖啡馆</h1></body></html>`;

test("parses a complete generation", () => {
  const result = parseGeneration(`TITLE: 咖啡馆\nNOTE: 做了菜单和预约。\n---HTML---\n${page}`);
  assert.deepEqual(result, {
    title: "咖啡馆",
    note: "做了菜单和预约。",
    html: page,
  });
});

test("rejects a truncated page", () => {
  const result = parseGeneration("TITLE: 咖啡馆\nNOTE: 一半\n---HTML---\n<div>未完成");
  assert.deepEqual(result, { error: "页面没有生成完整，请再试一次" });
});

test("names the current generation phase", () => {
  assert.equal(generationPhase("TITLE: 咖啡馆"), "understand");
  assert.equal(generationPhase("TITLE: 咖啡馆\nNOTE: 正在做菜单"), "explain");
  assert.equal(generationPhase("TITLE: 咖啡馆\nNOTE: 好\n---HTM"), "explain");
  assert.equal(generationPhase(`TITLE: 咖啡馆\nNOTE: 好\n---HTML---\n${page}`), "write");
});

test("applies a unique patch and leaves the rest untouched", () => {
  const current = `<!DOCTYPE html>
<html lang="zh-CN"><body><h1>咖啡馆</h1><button id="book">预约</button></body></html>`;
  const raw = `TITLE: 咖啡馆
NOTE: 把标题改成深色。
---PATCH---
<<<<<<< SEARCH
<h1>咖啡馆</h1>
=======
<h1 class="dark">咖啡馆</h1>
>>>>>>> REPLACE`;
  const result = resolveGeneration(raw, current);
  assert.equal("error" in result, false);
  if ("error" in result) return;
  assert.match(result.html, /class="dark"/);
  assert.match(result.html, /id="book"/);
  assert.equal(result.note, "把标题改成深色。");
});

test("rejects a patch that does not match", () => {
  const current = `<!DOCTYPE html><html><body><h1>咖啡馆</h1></body></html>`;
  const raw = `TITLE: 咖啡馆
NOTE: 没对上。
---PATCH---
<<<<<<< SEARCH
<h1>不存在</h1>
=======
<h1>新的</h1>
>>>>>>> REPLACE`;
  assert.deepEqual(resolveGeneration(raw, current), { error: "没有在当前页面里找到要改的片段" });
});

test("rejects a patch that matches more than once", () => {
  const html = "<!DOCTYPE html><html><body><p>同样</p><p>同样</p></body></html>";
  const applied = applyEdits(html, [{ search: "<p>同样</p>", replace: "<p>改过</p>" }]);
  assert.deepEqual(applied, { error: "要改的片段出现了不止一次" });
});

test("stitches a truncated page and ignores a repeated tail", () => {
  const shared = "<section id=\"menu\">今日菜单";
  const head = `TITLE: 咖啡馆\nNOTE: 一半\n---HTML---\n<div>${shared}`;
  const tail = `${shared}</div></body></html>`;
  assert.equal(stitch(head, tail), `TITLE: 咖啡馆\nNOTE: 一半\n---HTML---\n<div>${shared}</div></body></html>`);
  assert.equal(isCompleteOutput(head), false);
  assert.equal(isCompleteOutput(`${head}</div></body></html>`), true);
});

test("streams only the note", () => {
  const partial = "TITLE: 咖啡馆\nNOTE: 正在做菜单";
  assert.equal(streamingNote(partial), "正在做菜单");
  assert.equal(streamingNote(`${partial}\n---HTML---\n${page}`), "正在做菜单");
  assert.equal(streamingNote("TITLE: 咖啡馆\nNOTE: 好\n---HTM"), "好");
});
