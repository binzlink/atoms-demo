import { useEffect, useState } from "react";

export function useTypewriter(text: string, active: boolean): string {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (count > text.length) {
      setCount(0);
      return;
    }
    if (count >= text.length) return;
    const timer = window.setTimeout(() => setCount((current) => Math.min(text.length, current + 1)), 24);
    return () => window.clearTimeout(timer);
  }, [active, count, text]);

  if (!active) return text;
  return text.slice(0, Math.min(count, text.length));
}
