import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PromptBox } from "../components/PromptBox";
import { ProjectList } from "../components/ProjectList";
import { openDraft } from "../draftSession";
import { useProjectList } from "../hooks/useProjectList";

const EXAMPLES = ["做一个咖啡馆官网，有菜单和预约", "做一个可以勾选的待办清单", "做一个能按颜色筛选的相册"];

export function HomePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [leaving, setLeaving] = useState(false);
  const catalog = useProjectList();

  function submit() {
    const text = prompt.trim();
    if (!text || leaving) return;
    setLeaving(true);
    navigate("/studio/new", { state: { token: openDraft(text) } });
  }

  return (
    <div>
      <header className="flex items-center justify-between gap-4 px-7 py-4.5">
        <span className="font-display text-[22px] font-semibold">Atoms Demo</span>
        <span className="text-black/55">公开工作室</span>
      </header>
      <main className="mx-auto mb-16 w-[min(920px,calc(100%-40px))]">
        <section className="pb-3 pt-7">
          <p className="mb-2 text-xs tracking-[0.08em] text-accent uppercase">从一句话开始</p>
          <h1 className="mb-6 font-display text-[clamp(40px,6vw,68px)] leading-[0.98] font-semibold tracking-[-0.03em] text-pretty">
            做出一个能打开、能点击的网页。
          </h1>
          <PromptBox
            id="prompt"
            className="panel"
            value={prompt}
            pending={leaving}
            placeholder="例如：做一个咖啡馆官网，有菜单和预约"
            submitLabel="生成"
            pendingLabel="进入工作台"
            error=""
            onChange={setPrompt}
            onSubmit={submit}
            footer={(submitButton) => (
              <div className="flex items-center justify-between gap-2.5 max-[800px]:flex-col max-[800px]:items-stretch">
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((example) => (
                    <button key={example} type="button" className="btn-quiet" disabled={leaving} onClick={() => setPrompt(example)}>
                      {example}
                    </button>
                  ))}
                </div>
                {submitButton}
              </div>
            )}
          />
        </section>
        <ProjectList projects={catalog.projects} error={catalog.error} />
      </main>
    </div>
  );
}
