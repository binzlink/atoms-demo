import type { FormEvent, KeyboardEvent, ReactNode } from "react";

type PromptBoxProps = {
  id: string;
  value: string;
  pending: boolean;
  placeholder: string;
  submitLabel: string;
  pendingLabel: string;
  className: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  footer?: (submit: ReactNode) => ReactNode;
  error?: string;
};

export function PromptBox({
  id,
  value,
  pending,
  placeholder,
  submitLabel,
  pendingLabel,
  className,
  onChange,
  onSubmit,
  footer,
  error,
}: PromptBoxProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  const submitButton = (
    <button className="btn-primary" type="submit" disabled={pending || !value.trim()}>
      {pending ? pendingLabel : submitLabel}
    </button>
  );

  return (
    <form className={className} onSubmit={submit}>
      <label className="sr-only" htmlFor={id}>
        描述
      </label>
      <textarea id={id} className="field" value={value} placeholder={placeholder} disabled={pending} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} />
      {footer ? footer(submitButton) : submitButton}
      {error ? <p className="text-sm font-medium text-accent">{error}</p> : null}
    </form>
  );
}
