import assert from "node:assert/strict";
import test from "node:test";
import { generationPhase, parseGeneration, streamingNote } from "./parse.ts";

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

test("streams only the note", () => {
  const partial = "TITLE: 咖啡馆\nNOTE: 正在做菜单";
  assert.equal(streamingNote(partial), "正在做菜单");
  assert.equal(streamingNote(`${partial}\n---HTML---\n${page}`), "正在做菜单");
  assert.equal(streamingNote("TITLE: 咖啡馆\nNOTE: 好\n---HTM"), "好");
});
