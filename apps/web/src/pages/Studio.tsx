import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ChatMessage } from "@atoms/shared";
import { deleteProject, getProject, publishProject } from "../api/client";
import { ChatThread } from "../components/ChatThread";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PromptBox } from "../components/PromptBox";
import { StudioWorkspace } from "../components/StudioWorkspace";
import { useGeneration } from "../hooks/useGeneration";
import { useProject } from "../hooks/useProject";
import { formatWhen } from "../format";
import { publishUrl } from "../publishUrl";
import { DraftStudio } from "./DraftStudio";

export function StudioPage() {
  const { id = "" } = useParams();
  if (id === "new") return <DraftStudio />;
  return <ProjectStudio id={id} />;
}

function ProjectStudio({ id }: { id: string }) {
  const navigate = useNavigate();
  const { project, setProject, missing } = useProject(id);
  const generation = useGeneration();
  const [prompt, setPrompt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function submit() {
    const text = prompt.trim();
    if (!text || generation.pending || !project) return;
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setProject({ ...project, messages: [...project.messages, optimistic] });
    setPrompt("");
    const next = await generation.run(`/api/projects/${id}/messages`, text);
    if (next) {
      setProject(next);
      return;
    }
    const fresh = await getProject(id).catch(() => null);
    if (fresh) setProject(fresh);
  }

  async function publish() {
    if (!project || publishing) return;
    setPublishing(true);
    try {
      setProject(await publishProject(id));
    } finally {
      setPublishing(false);
    }
  }

  if (missing) {
    return (
      <div className="px-7 py-12">
        <p>这个项目不存在。</p>
        <Link to="/" className="text-accent">
          回到首页
        </Link>
      </div>
    );
  }

  if (!project) return <div className="px-7 py-12">正在打开项目…</div>;

  const link = publishUrl(project.id);
  const publishLabel = !project.publishedAt ? "发布" : project.hasUnpublishedChanges ? "更新发布" : "已发布";

  return (
    <StudioWorkspace
      title={project.title}
      detail={
        <>
          <span>{formatWhen(project.updatedAt)}</span>
          {project.publishedAt ? (
            <a href={link} target="_blank" rel="noreferrer" className="block truncate text-accent">
              {link}
            </a>
          ) : null}
        </>
      }
      actions={
        <>
          <button type="button" className="btn-primary" disabled={publishing || !project.hasUnpublishedChanges} onClick={() => void publish()}>
            {publishing ? "发布中" : publishLabel}
          </button>
          <button type="button" className="btn-ink" onClick={() => setConfirmDelete(true)}>
            删除
          </button>
        </>
      }
      thread={<ChatThread messages={project.messages} pending={generation.pending} draft={generation.note} status={generation.status} />}
      composer={
        <PromptBox
          id="revise"
          className="panel m-3"
          value={prompt}
          pending={generation.pending}
          placeholder="例如：把标题改成深色，预约按钮更明显"
          submitLabel="发送"
          pendingLabel="生成中"
          error={generation.error}
          onChange={setPrompt}
          onSubmit={() => void submit()}
        />
      }
      html={project.currentHtml}
      dialog={
        confirmDelete ? (
          <ConfirmDialog
            title="删除这个项目？"
            body="首页不再显示它。已发布的地址会变成找不到。"
            confirmLabel="删除"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => {
              void deleteProject(id).then(() => navigate("/"));
            }}
          />
        ) : null
      }
    />
  );
}
