import { useState } from "react";
import type { ProjectDetail } from "@atoms/shared";
import { streamGeneration } from "../api/stream";

export function useGeneration() {
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function run(path: string, prompt: string): Promise<ProjectDetail | null> {
    setPending(true);
    setError("");
    setNote("");
    setStatus("正在连接");
    try {
      return await streamGeneration(path, prompt, {
        onDelta: (delta) => setNote((current) => current + delta),
        onStatus: setStatus,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "生成失败，请再试一次");
      return null;
    } finally {
      setPending(false);
    }
  }

  return { pending, note, status, error, run };
}
