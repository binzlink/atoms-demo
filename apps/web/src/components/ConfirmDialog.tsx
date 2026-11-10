export function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }: { title: string; body: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-black/30" role="presentation">
      <div className="w-[min(420px,calc(100%-32px))] rounded-2xl border border-black/10 bg-white p-5" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" className="mb-2 font-display text-2xl">
          {title}
        </h2>
        <p className="mb-4 text-black/70">{body}</p>
        <div className="flex justify-end gap-2.5">
          <button type="button" className="btn-quiet" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="btn-ink" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
