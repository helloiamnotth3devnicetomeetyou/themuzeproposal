import { useEffect, useRef } from "react";

const selector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>(selector)].filter(
        (element) => !element.hasAttribute("hidden"),
      );
    const first = focusable()[0];
    first?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const current = document.activeElement;
      const index = items.indexOf(current as HTMLElement);
      if (
        event.shiftKey ? index <= 0 : index === items.length - 1 || index < 0
      ) {
        event.preventDefault();
        (event.shiftKey ? items.at(-1) : items[0])?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return ref;
}
