import { Link } from "react-router-dom";
import type { ProjectSummary } from "@atoms/shared";
import { publishUrl } from "../publishUrl";
import { formatWhen } from "../format";

export function ProjectList({ projects, error }: { projects: ProjectSummary[] | null; error: string }) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">全部项目</h2>
        <span className="text-black/55">{projects ? `${projects.length} 个` : ""}</span>
      </div>
      {error ? <p className="mt-3.5 text-sm font-medium text-accent">{error}</p> : null}
      {projects && projects.length === 0 ? <p className="mt-3.5 text-black/55">还没有项目。上面写下一句，就会出现在这里。</p> : null}
      <ul className="mt-3 list-none border-t border-black/10 p-0">
        {projects?.map((project) => (
          <li key={project.id} className="flex items-center justify-between gap-4 border-b border-black/10">
            <Link to={`/studio/${project.id}`} className="flex flex-1 items-center justify-between gap-4 py-4 no-underline">
              <strong className="font-semibold">{project.title}</strong>
              <span className="text-black/55">{formatWhen(project.updatedAt)}</span>
            </Link>
            {project.publishedAt ? (
              <a href={publishUrl(project.id)} target="_blank" rel="noreferrer" className="text-accent no-underline">
                已发布
              </a>
            ) : (
              <em className="text-black/55 not-italic">草稿</em>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
