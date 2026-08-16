type SessionDraftValidator<T> = (value: unknown) => value is T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function readSessionDraft<T>(
  key: string,
  validate?: SessionDraftValidator<T>,
): T | null {
  try {
    const value = window.sessionStorage.getItem(key);
    if (!value) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      window.sessionStorage.removeItem(key);
      return null;
    }
    if (!isRecord(parsed) || (validate && !validate(parsed))) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export function writeSessionDraft(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be disabled or full; the form must still work.
  }
}

export function removeSessionDraft(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be disabled.
  }
}
