export function readSessionDraft<T>(key: string): T | null {
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
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
