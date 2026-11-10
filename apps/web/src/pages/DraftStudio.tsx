import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ChatMessage } from "@atoms/shared";
import { ChatThread } from "../components/ChatThread";
import { PromptBox } from "../components/PromptBox";
import { StudioWorkspace } from "../components/StudioWorkspace";
import { openDraft } from "../draftSession";
import { useDraft } from "../hooks/useDraft";

export function DraftStudio() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = readToken(location.state);
  const session = useDraft(token);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!session?.project) return;
    navigate(`/studio/${session.project.id}`, { replace: true, state: { project: session.project } });
  }, [navigate, session?.project]);

  useEffect(() => {
    if (session?.error) setPrompt(session.prompt);
  }, [session?.error, session?.prompt]);

  if (!session) {
    return (
      <div className="px-7 py-12">
        <p>从首页写下一句，就能在这里看到生成过程。</p>
        <Link to="/" className="text-accent">
          回到首页
        </Link>
      </div>
    );
  }

  const userMessage: ChatMessage = { id: `${session.token}-user`, role: "user", content: session.prompt, createdAt: "" };

  function retry() {
    const text = prompt.trim();
    if (!text || !session || session.pending) return;
    setPrompt("");
    navigate("/studio/new", { replace: true, state: { token: openDraft(text) } });
  }

  return (
    <StudioWorkspace
      title="新页面"
      detail={session.pending ? session.status : "还没有保存"}
      thread={<ChatThread messages={[userMessage]} pending={session.pending} draft={session.note} status={session.status} />}
      composer={
        <PromptBox
          id="draft"
          className="panel m-3"
          value={prompt}
          pending={session.pending}
          placeholder="生成结束后可以继续修改"
          submitLabel="重新生成"
          pendingLabel="生成中"
          error={session.error}
          onChange={setPrompt}
          onSubmit={retry}
        />
      }
      html=""
    />
  );
}

function readToken(state: unknown): string {
  if (!state || typeof state !== "object" || !("token" in state)) return "";
  const token = (state as { token?: unknown }).token;
  return typeof token === "string" ? token : "";
}
