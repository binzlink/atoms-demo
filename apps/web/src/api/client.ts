import type { ProjectDetail, ProjectSummary } from "@atoms/shared";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8787";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const body = await request<{ projects: ProjectSummary[] }>("/api/projects");
  return body.projects;
}

export async function getProject(id: string): Promise<ProjectDetail> {
  const body = await request<{ project: ProjectDetail }>(`/api/projects/${id}`);
  return body.project;
}

export async function publishProject(id: string): Promise<ProjectDetail> {
  const body = await request<{ project: ProjectDetail }>(`/api/projects/${id}/publish`, { method: "POST" });
  return body.project;
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/api/projects/${id}`, { method: "DELETE" });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  if (!response.ok) throw new Error(await errorMessage(response));
  return (await response.json()) as T;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || "请求失败";
  } catch {
    return "请求失败";
  }
}
