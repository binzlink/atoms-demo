import { useEffect, useState } from "react";
import type { ProjectSummary } from "@atoms/shared";
import { listProjects } from "../api/client";

export function useProjectList() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((items) => {
        if (!cancelled) setProjects(items);
      })
      .catch(() => {
        if (!cancelled) setError("项目列表暂时加载不了");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, error };
}
