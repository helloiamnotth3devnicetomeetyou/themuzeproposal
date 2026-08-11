"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Heading2, Heading3, Italic, Link, List, ListOrdered, Quote, Redo2, RemoveFormatting, Strikethrough, Underline, Undo2 } from "lucide-react";
import { escapeHtml, sanitizeRichText } from "@/core/utils/rich-text";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  errorId?: string;
  invalid?: boolean;
};

type FormatName = "bold" | "italic" | "underline" | "strikeThrough" | "h2" | "h3" | "blockquote";

const toolLabel: Record<FormatName, string> = {
  bold: "굵게",
  italic: "기울임",
  underline: "밑줄",
  strikeThrough: "취소선",
  h2: "큰 제목",
  h3: "작은 제목",
  blockquote: "인용문",
};

export default function RichTextEditor({
  value,
  onChange,
  label = "내용",
  placeholder = "공지 내용을 입력하세요.",
  required = true,
  id,
  errorId,
  invalid = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Set<FormatName>>(new Set());

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const updateActiveFormats = useCallback(() => {
    const editor = editorRef.current;
    const selection = document.getSelection();
    if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) return;

    const next = new Set<FormatName>();
    if (document.queryCommandState("bold")) next.add("bold");
    if (document.queryCommandState("italic")) next.add("italic");
    if (document.queryCommandState("underline")) next.add("underline");
    if (document.queryCommandState("strikeThrough")) next.add("strikeThrough");

    const block = String(document.queryCommandValue("formatBlock")).toLowerCase().replace(/[<>]/g, "");
    if (block === "h2") next.add("h2");
    if (block === "h3") next.add("h3");
    if (block === "blockquote") next.add("blockquote");
    setActive(next);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;
    const sanitized = sanitizeRichText(value);
    if (editor.innerHTML !== sanitized) editor.innerHTML = sanitized;
  }, [value]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    updateActiveFormats();
    emitChange();
  };

  const formatBlock = (tag: "h2" | "h3" | "blockquote") => {
    const isActive = active.has(tag);
    runCommand("formatBlock", isActive ? "p" : tag);
  };

  const addLink = () => {
    const href = window.prompt("연결할 주소를 입력하세요.", "https://");
    if (!href) return;
    runCommand("createLink", href);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const safeContent = html ? sanitizeRichText(html) : escapeHtml(text).replace(/\r?\n/g, "<br>");
    document.execCommand("insertHTML", false, safeContent);
    emitChange();
  };

  const handleBlur = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const sanitized = sanitizeRichText(editor.innerHTML);
    editor.innerHTML = sanitized;
    onChange(sanitized);
  };

  const formatButton = (
    format: FormatName,
    icon: React.ReactNode,
  ) => (
    <button
      type="button"
      className={active.has(format) ? "is-active" : ""}
      aria-label={toolLabel[format]}
      aria-pressed={active.has(format)}
      title={toolLabel[format]}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (format === "h2" || format === "h3" || format === "blockquote") {
          formatBlock(format);
          return;
        }
        runCommand(format);
      }}
    >
      {icon}
    </button>
  );

  return (
    <div className="rich-text-field">
      <div className="rich-text-label">
        <span>{label}{required && <> <b>*</b></>}</span>
        <small>텍스트를 선택한 뒤 서식을 적용하세요.</small>
      </div>
      <div className="rich-text-shell">
        <div className="rich-text-toolbar" role="toolbar" aria-label="본문 서식">
          <div className="rich-text-tool-group">
            {formatButton("h2", <Heading2 aria-hidden="true" />)}
            {formatButton("h3", <Heading3 aria-hidden="true" />)}
          </div>
          <div className="rich-text-tool-group">
            {formatButton("bold", <Bold aria-hidden="true" />)}
            {formatButton("italic", <Italic aria-hidden="true" />)}
            {formatButton("underline", <Underline aria-hidden="true" />)}
            {formatButton("strikeThrough", <Strikethrough aria-hidden="true" />)}
          </div>
          <div className="rich-text-tool-group">
            <button type="button" aria-label="글머리 목록" title="글머리 목록" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}><List aria-hidden="true" /></button>
            <button type="button" aria-label="번호 목록" title="번호 목록" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")}><ListOrdered aria-hidden="true" /></button>
            {formatButton("blockquote", <Quote aria-hidden="true" />)}
            <button type="button" aria-label="링크" title="링크" onMouseDown={(event) => event.preventDefault()} onClick={addLink}><Link aria-hidden="true" /></button>
          </div>
          <div className="rich-text-tool-group rich-text-history-tools">
            <button type="button" aria-label="실행 취소" title="실행 취소" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("undo")}><Undo2 aria-hidden="true" /></button>
            <button type="button" aria-label="다시 실행" title="다시 실행" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("redo")}><Redo2 aria-hidden="true" /></button>
            <button type="button" aria-label="서식 지우기" title="서식 지우기" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("removeFormat")}><RemoveFormatting aria-hidden="true" /></button>
          </div>
        </div>
        <div
          ref={editorRef}
          className="rich-text-editor"
          id={id}
          contentEditable
          role="textbox"
          aria-label={label}
          aria-multiline="true"
          aria-invalid={invalid}
          aria-describedby={errorId}
          data-placeholder={placeholder}
          suppressContentEditableWarning
          spellCheck
          onInput={emitChange}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onPaste={handlePaste}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
}
