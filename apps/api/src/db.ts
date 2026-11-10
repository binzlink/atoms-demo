import type { ChatMessage, ProjectDetail, ProjectSummary } from "@atoms/shared";
import type { Env } from "./env.ts";
import { createId, createMessageId } from "./ids.ts";

export type ProjectRow = {
  id: string;
  title: string;
  current_html: string;
  published_html: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function listProjectRows(env: Env): Promise<ProjectRow[]> {
  const rows = await env.DB.prepare(
    `SELECT id, title, current_html, published_html, published_at, updated_at
     FROM projects ORDER BY updated_at DESC`,
  ).all<ProjectRow>();
  return rows.results ?? [];
}

export async function findProject(env: Env, id: string): Promise<ProjectRow | null> {
  return env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(id).first<ProjectRow>();
}

export async function listMessages(env: Env, projectId: string): Promise<MessageRow[]> {
  const rows = await env.DB.prepare(
    "SELECT id, role, content, created_at FROM messages WHERE project_id = ? ORDER BY created_at ASC",
  )
    .bind(projectId)
    .all<MessageRow>();
  return rows.results ?? [];
}

export async function projectDetail(env: Env, row: ProjectRow): Promise<ProjectDetail> {
  const messages = await listMessages(env, row.id);
  return { ...toSummary(row), currentHtml: row.current_html, messages: messages.map(toMessage) };
}

export function toSummary(row: ProjectRow): ProjectSummary {
  const published = Boolean(row.published_html);
  return {
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    hasUnpublishedChanges: !published || row.published_html !== row.current_html,
  };
}

export async function allocateId(env: Env): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = createId();
    if (!(await findProject(env, id))) return id;
  }
  throw new Error("无法分配项目编号");
}

export async function insertProject(env: Env, project: { id: string; title: string; html: string; prompt: string; note: string; now: string }) {
  const user = message("user", project.prompt, project.now);
  const assistant = message("assistant", project.note, project.now);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO projects
       (id, title, current_html, published_html, published_at, created_at, updated_at)
       VALUES (?, ?, ?, NULL, NULL, ?, ?)`,
    ).bind(project.id, project.title, project.html, project.now, project.now),
    insertMessage(env, project.id, user),
    insertMessage(env, project.id, assistant),
  ]);
}

export async function saveRevision(env: Env, projectId: string, revision: { html: string; prompt: string; note: string; now: string }) {
  await env.DB.batch([
    insertMessage(env, projectId, message("user", revision.prompt, revision.now)),
    insertMessage(env, projectId, message("assistant", revision.note, revision.now)),
    env.DB.prepare("UPDATE projects SET current_html = ?, updated_at = ? WHERE id = ?").bind(
      revision.html,
      revision.now,
      projectId,
    ),
  ]);
}

export async function markPublished(env: Env, id: string, now: string) {
  await env.DB.prepare(
    "UPDATE projects SET published_html = current_html, published_at = ?, updated_at = ? WHERE id = ?",
  )
    .bind(now, now, id)
    .run();
}

export async function removeProject(env: Env, id: string) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM messages WHERE project_id = ?").bind(id),
    env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(id),
  ]);
}

export async function publishedHtml(env: Env, id: string): Promise<string | null> {
  const row = await env.DB.prepare("SELECT published_html FROM projects WHERE id = ?")
    .bind(id)
    .first<{ published_html: string | null }>();
  return row?.published_html ?? null;
}

function message(role: ChatMessage["role"], content: string, createdAt: string): ChatMessage {
  return { id: createMessageId(), role, content, createdAt };
}

function insertMessage(env: Env, projectId: string, item: ChatMessage) {
  return env.DB.prepare(
    "INSERT INTO messages (id, project_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
  ).bind(item.id, projectId, item.role, item.content, item.createdAt);
}

function toMessage(item: MessageRow): ChatMessage {
  return { id: item.id, role: item.role, content: item.content, createdAt: item.created_at };
}
