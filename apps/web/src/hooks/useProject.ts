import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { ProjectDetail } from "@atoms/shared";
import { getProject } from "../api/client";

export function useProject(id: string) {
  const location = useLocation();
  const [project, setProject] = useState<ProjectDetail | null>(() => seededProject(location.state, id));
  const [missing, setMissing] = useState(false);
  const visible = project?.id === id ? project : null;

  useEffect(() => {
    if (visible) return;
    let cancelled = false;
    getProject(id)
      .then((item) => {
        if (!cancelled) setProject(item);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, visible]);

  return { project: visible, setProject, missing };
}

function seededProject(state: unknown, id: string): ProjectDetail | null {
  if (!state || typeof state !== "object" || !("project" in state)) return null;
  const project = (state as { project?: ProjectDetail }).project;
  if (!project || project.id !== id || typeof project.currentHtml !== "string" || !Array.isArray(project.messages)) return null;
  return project;
}
