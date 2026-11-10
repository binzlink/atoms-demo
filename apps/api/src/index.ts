import { findProject, listProjectRows, markPublished, projectDetail, publishedHtml, removeProject, toSummary } from "./db.ts";
import type { Env } from "./env.ts";
import { createProject, reviseProject } from "./generate.ts";
import { errorText, json, log, readPrompt, withCors } from "./http.ts";

const ID = "([a-z2-9]{8})";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return withCors(request, new Response(null, { status: 204 }));
    const url = new URL(request.url);
    try {
      const response = await route(request, env, url.pathname.replace(/\/$/, "") || "/");
      return url.pathname.startsWith("/p/") ? response : withCors(request, response);
    } catch (error) {
      log("unhandled", { message: errorText(error) });
      return withCors(request, json({ message: "服务暂时不可用" }, 500));
    }
  },
};

async function route(request: Request, env: Env, path: string): Promise<Response> {
  if (request.method === "GET" && path === "/api/health") return json({ ok: true });

  const published = path.match(new RegExp(`^/p/${ID}$`));
  if (request.method === "GET" && published) return renderPublished(env, published[1]);

  if (request.method === "GET" && path === "/api/projects") return list(env);
  if (request.method === "POST" && path === "/api/projects") return begin(request, env);

  const project = path.match(new RegExp(`^/api/projects/${ID}$`));
  if (project && request.method === "GET") return show(env, project[1]);
  if (project && request.method === "DELETE") return destroy(env, project[1]);

  const messages = path.match(new RegExp(`^/api/projects/${ID}/messages$`));
  if (messages && request.method === "POST") return revise(request, env, messages[1]);

  const publish = path.match(new RegExp(`^/api/projects/${ID}/publish$`));
  if (publish && request.method === "POST") return publishCurrent(env, publish[1]);

  return json({ message: "没有这个地址" }, 404);
}

async function list(env: Env) {
  const rows = await listProjectRows(env);
  return json({ projects: rows.map(toSummary) });
}

async function show(env: Env, id: string) {
  const project = await findProject(env, id);
  if (!project) return json({ message: "项目不存在" }, 404);
  return json({ project: await projectDetail(env, project) });
}

async function destroy(env: Env, id: string) {
  if (!(await findProject(env, id))) return json({ message: "项目不存在" }, 404);
  await removeProject(env, id);
  return json({ ok: true });
}

async function publishCurrent(env: Env, id: string) {
  if (!(await findProject(env, id))) return json({ message: "项目不存在" }, 404);
  const now = new Date().toISOString();
  await markPublished(env, id, now);
  const project = await findProject(env, id);
  return json({ project: await projectDetail(env, project!) });
}

async function begin(request: Request, env: Env) {
  const prompt = await readPrompt(request);
  if (typeof prompt !== "string") return prompt;
  return createProject(env, prompt);
}

async function revise(request: Request, env: Env, id: string) {
  const prompt = await readPrompt(request);
  if (typeof prompt !== "string") return prompt;
  return reviseProject(env, id, prompt);
}

async function renderPublished(env: Env, id: string) {
  const html = await publishedHtml(env, id);
  if (!html) {
    return new Response("这个页面还没有发布", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "sandbox allow-scripts allow-forms allow-modals allow-popups",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
