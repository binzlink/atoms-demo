const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8787";

export function publishUrl(id: string): string {
  if (/localhost|127\.0\.0\.1/.test(API_BASE)) return `${API_BASE}/p/${id}`;
  return `https://ai111.ai/p/${id}`;
}
