import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PreviewFrame } from "./PreviewFrame";

export function StudioWorkspace({
  title,
  detail,
  actions,
  thread,
  composer,
  html,
  dialog,
}: {
  title: string;
  detail?: ReactNode;
  actions?: ReactNode;
  thread: ReactNode;
  composer: ReactNode;
  html: string;
  dialog?: ReactNode;
}) {
  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden max-[800px]:h-auto max-[800px]:overflow-visible">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-black/10 bg-white px-7 py-4">
        <Link to="/" className="btn-quiet no-underline whitespace-nowrap">
          全部项目
        </Link>
        <div className="grid min-w-0">
          <strong className="truncate font-display text-[22px] font-semibold">{title}</strong>
          {detail ? <div className="grid min-w-0 text-black/55">{detail}</div> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
      </header>
      <div className="grid min-h-0 grid-cols-[minmax(280px,380px)_minmax(0,1fr)] max-[800px]:grid-cols-1">
        <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] border-r border-black/10 max-[800px]:border-t max-[800px]:border-r-0">
          {thread}
          {composer}
        </aside>
        <PreviewFrame html={html} />
      </div>
      {dialog}
    </div>
  );
}
