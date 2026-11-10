import type { StreamEvent } from "@atoms/shared";
import { allocateId, findProject, insertProject, listMessages, projectDetail, saveRevision } from "./db.ts";
import type { Env } from "./env.ts";
import { json, log } from "./http.ts";
import { streamModel } from "./model.ts";
import { parseGeneration, type Generation } from "./parse.ts";
import { createUserPrompt, reviseUserPrompt, SYSTEM_PROMPT } from "./prompt.ts";
import { eventStream, noteDeltas } from "./stream.ts";

type ModelMessage = { role: "system" | "user"; content: string };

export function createProject(env: Env, prompt: string): Response {
  return eventStream(async (emit) => {
    const started = Date.now();
    const parsed = await generate(env, [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: createUserPrompt(prompt) }], emit, "正在理解你的描述");
    if ("error" in parsed || !parsed.title) {
      log("create", { ok: false, ms: Date.now() - started });
      emit({ type: "error", message: "error" in parsed ? parsed.error : "模型没有返回标题" });
      return;
    }
    const now = new Date().toISOString();
    const id = await allocateId(env);
    await insertProject(env, { id, title: parsed.title, html: parsed.html, prompt, note: parsed.note, now });
    const row = await findProject(env, id);
    log("create", { ok: true, id, ms: Date.now() - started });
    emit({ type: "done", project: await projectDetail(env, row!) });
  });
}

export async function reviseProject(env: Env, id: string, prompt: string): Promise<Response> {
  const existing = await findProject(env, id);
  if (!existing) return json({ message: "项目不存在" }, 404);
  const history = await listMessages(env, id);
  return eventStream(async (emit) => {
    const started = Date.now();
    const parsed = await generate(
      env,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: reviseUserPrompt(prompt, existing.current_html, history) },
      ],
      emit,
      "正在理解这次修改",
    );
    if ("error" in parsed) {
      log("revise", { ok: false, id, ms: Date.now() - started });
      emit({ type: "error", message: parsed.error });
      return;
    }
    const now = new Date().toISOString();
    await saveRevision(env, id, { html: parsed.html, prompt, note: parsed.note, now });
    const row = await findProject(env, id);
    log("revise", { ok: true, id, ms: Date.now() - started });
    emit({ type: "done", project: await projectDetail(env, row!) });
  });
}

async function generate(env: Env, messages: ModelMessage[], emit: (event: StreamEvent) => void, opening: string): Promise<Generation | { error: string }> {
  emit({ type: "status", text: opening });
  const raw = await streamModel(env.AI, messages, noteDeltas(emit, opening));
  return parseGeneration(raw);
}
