export function PreviewFrame({ html }: { html: string }) {
  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-white max-[800px]:h-[70vh]">
      <div className="flex items-center gap-1.5 px-3.5 py-2.5">
        <span className="size-2 rounded-full bg-black/20" />
        <span className="size-2 rounded-full bg-black/20" />
        <span className="size-2 rounded-full bg-black/20" />
        <em className="ml-2 text-[13px] text-black/55 not-italic">预览</em>
      </div>
      {html ? (
        <iframe className="h-full w-full border-0 bg-white" title="页面预览" sandbox="allow-scripts allow-forms allow-modals allow-popups" srcDoc={html} />
      ) : (
        <div className="grid h-full place-items-center bg-white text-sm text-black/45">页面生成后会出现在这里</div>
      )}
    </section>
  );
}
