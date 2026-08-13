"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, Search } from "lucide-react";

type NoticeCategoryInputProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export default function NoticeCategoryInput({
  value,
  options,
  onChange,
}: NoticeCategoryInputProps) {
  const id = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = value.trim().toLocaleLowerCase("ko");
  const suggestions = useMemo(
    () =>
      options
        .filter(
          (option) => !query || option.toLocaleLowerCase("ko").includes(query),
        )
        .slice(0, 8),
    [options, query],
  );
  const exactMatch = options.some(
    (option) => option.toLocaleLowerCase("ko") === query,
  );
  const showPanel = open && (suggestions.length > 0 || Boolean(value.trim()));

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  const choose = (category: string) => {
    onChange(category);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        Math.min(current + 1, suggestions.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, -1));
      return;
    }
    if (event.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        choose(suggestions[activeIndex]);
      } else {
        setOpen(false);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={rootRef} className="notice-category-combobox">
      <Search aria-hidden="true" />
      <input
        className="admin-input"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder="분류 검색 또는 새로 입력"
        aria-label="공지 분류"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={`${id}-suggestions`}
        aria-activedescendant={
          activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        autoComplete="off"
      />

      {showPanel && (
        <div
          id={`${id}-suggestions`}
          className="notice-category-suggestions"
          role="listbox"
          aria-label="분류 제안"
        >
          <span className="notice-category-suggestions-label">
            {query ? "검색 결과" : "분류 제안"}
          </span>
          {suggestions.map((category, index) => (
            <button
              id={`${id}-option-${index}`}
              key={category}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              role="option"
              aria-selected={category === value}
              onPointerMove={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(category)}
            >
              <span>{category}</span>
              {category === value && <Check aria-hidden="true" />}
            </button>
          ))}
          {!exactMatch && value.trim() && (
            <div className="notice-category-new-hint">
              <b>NEW</b>
              <span>
                <strong>{value.trim()}</strong> 그대로 새 분류로 저장됩니다.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
