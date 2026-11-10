import type { ProjectDetail } from "@atoms/shared";
import { streamGeneration } from "./api/stream";

export type DraftSession = {
  token: string;
  prompt: string;
  note: string;
  status: string;
  error: string;
  pending: boolean;
  project: ProjectDetail | null;
};

type Listener = () => void;

const sessions = new Map<string, { state: DraftSession; listeners: Set<Listener> }>();

export function openDraft(prompt: string): string {
  const token = crypto.randomUUID();
  const state: DraftSession = {
    token,
    prompt,
    note: "",
    status: "正在连接",
    error: "",
    pending: true,
    project: null,
  };
  const listeners = new Set<Listener>();
  sessions.set(token, { state, listeners });
  void run(token);
  return token;
}

export function readDraft(token: string): DraftSession | null {
  return sessions.get(token)?.state ?? null;
}

export function subscribeDraft(token: string, listener: Listener): () => void {
  const session = sessions.get(token);
  if (!session) return () => {};
  session.listeners.add(listener);
  return () => session.listeners.delete(listener);
}

async function run(token: string) {
  const session = sessions.get(token);
  if (!session) return;
  try {
    const project = await streamGeneration("/api/projects", session.state.prompt, {
      onDelta: (text) => update(token, (current) => ({ ...current, note: current.note + text })),
      onStatus: (text) => update(token, (current) => ({ ...current, status: text })),
    });
    update(token, (current) => ({ ...current, project, pending: false }));
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : "生成失败，请再试一次";
    update(token, (current) => ({ ...current, error, pending: false }));
  }
}

function update(token: string, change: (current: DraftSession) => DraftSession) {
  const session = sessions.get(token);
  if (!session) return;
  session.state = change(session.state);
  for (const listener of session.listeners) listener();
}
