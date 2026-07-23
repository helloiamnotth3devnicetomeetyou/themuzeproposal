"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import styles from "./CustomSelect.module.css";

export type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type ListboxPosition = {
  left: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
  edge: number;
};

type CustomSelectProps = {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  variant?: "field" | "line";
  disabled?: boolean;
};

export default function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "선택",
  className = "",
  variant = "field",
  disabled = false,
}: CustomSelectProps) {
  const reactId = useId();
  const id = useMemo(() => `custom-select-${reactId.replace(/:/g, "")}`, [reactId]);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [listboxPosition, setListboxPosition] = useState<ListboxPosition | null>(null);
  const selected = options.find((option) => option.value === value);

  const updateListboxPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 8;
    const gap = 6;
    const preferredHeight = 250;
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const spaceAbove = rect.top - gap - viewportPadding;
    const placement = spaceBelow >= Math.min(160, preferredHeight) || spaceBelow >= spaceAbove ? "bottom" : "top";
    const availableHeight = placement === "bottom" ? spaceBelow : spaceAbove;
    const width = Math.max(rect.width, variant === "line" ? 210 : rect.width);
    const left = Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - width - viewportPadding));

    setListboxPosition({
      left,
      width,
      maxHeight: Math.max(96, Math.min(preferredHeight, availableHeight)),
      placement,
      edge: placement === "bottom" ? rect.bottom + gap : window.innerHeight - rect.top + gap,
    });
  }, [variant]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updateListboxPosition();
    window.addEventListener("resize", updateListboxPosition);
    window.addEventListener("scroll", updateListboxPosition, true);
    return () => {
      window.removeEventListener("resize", updateListboxPosition);
      window.removeEventListener("scroll", updateListboxPosition, true);
    };
  }, [open, updateListboxPosition]);

  useEffect(() => {
    if (!open || !listboxPosition) return;
    listRef.current?.focus();
  }, [listboxPosition, open, selectedIndex]);

  const moveActive = (direction: 1 | -1) => {
    if (!options.length) return;
    let next = activeIndex;
    for (let step = 0; step < options.length; step += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next].disabled) {
        setActiveIndex(next);
        break;
      }
    }
  };

  const selectOption = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      updateListboxPosition();
      setOpen(true);
      setActiveIndex(selectedIndex);
    }
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(-1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      const first = options.findIndex((option) => !option.disabled);
      if (first >= 0) setActiveIndex(first);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = options.map((option) => option.disabled).lastIndexOf(false);
      if (last >= 0) setActiveIndex(last);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectOption(activeIndex);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "Tab") setOpen(false);
  };

  return (
    <div ref={rootRef} className={`${styles.root} ${open ? styles.open : ""} ${className}`} data-variant={variant}>
      <button
        id={`${id}-button`}
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        disabled={disabled}
        onClick={() => {
          setActiveIndex(selectedIndex);
          if (open) {
            setOpen(false);
          } else {
            updateListboxPosition();
            setOpen(true);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={!selected ? styles.placeholder : ""}>{selected?.label || placeholder}</span>
        <LuChevronDown aria-hidden="true" />
      </button>

      {open && listboxPosition && typeof document !== "undefined" && createPortal(
        <div
          id={`${id}-listbox`}
          ref={listRef}
          className={styles.listbox}
          style={{
            left: listboxPosition.left,
            width: listboxPosition.width,
            maxHeight: listboxPosition.maxHeight,
            ...(listboxPosition.placement === "bottom" ? { top: listboxPosition.edge } : { bottom: listboxPosition.edge }),
          } as CSSProperties}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={`${id}-option-${activeIndex}`}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {options.map((option, index) => (
            <div
              id={`${id}-option-${index}`}
              key={option.value}
              className={`${styles.option} ${option.value === value ? styles.selected : ""} ${index === activeIndex ? styles.active : ""}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              onPointerMove={() => !option.disabled && setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <LuCheck aria-hidden="true" />}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
