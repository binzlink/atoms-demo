import { useSyncExternalStore } from "react";
import { readDraft, subscribeDraft, type DraftSession } from "../draftSession";

export function useDraft(token: string): DraftSession | null {
  return useSyncExternalStore(
    (listener) => subscribeDraft(token, listener),
    () => readDraft(token),
    () => null,
  );
}
