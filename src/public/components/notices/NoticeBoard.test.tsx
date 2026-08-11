import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import type { NoticeDTO, NoticeListDTO } from "@/public/features/notices/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("@/core/providers/LocaleContext", () => ({
  useLocale: () => ({ locale: "ko" }),
}));
vi.mock("@/core/components/feedback/LoadingIndicator", () => ({
  default: ({ label }: { label: string }) => <div>{label}</div>,
}));
vi.mock("@/core/components/form/CustomSelect", () => ({
  default: ({ options, value, onChange, ariaLabel }: {
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (v: string) => void;
    ariaLabel: string;
  }) => (
    <select aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
}));
vi.mock("@/styles/(public)/components/notices/NoticeBoard.module.css", () => ({ default: {} }));

import NoticeBoard from "./NoticeBoard";

const makeNotice = (id: string, title_ko: string, category_ko: string = "일반"): NoticeDTO => ({
  id,
  date: "2026-01-01",
  title: { ko: title_ko, en: title_ko, ja: title_ko },
  content: { ko: "본문 내용", en: "Content", ja: "内容" },
  category: { ko: category_ko, en: category_ko, ja: category_ko },
});

const makeData = (notices: NoticeDTO[], name = ""): NoticeListDTO => ({ name, notices });

describe("NoticeBoard", () => {
  it("renders heading NOTICE when no artistSlug", () => {
    render(<NoticeBoard initialData={makeData([])} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("NOTICE");
  });

  it("shows total notice count", () => {
    const notices = [makeNotice("1", "첫번째"), makeNotice("2", "두번째")];
    render(<NoticeBoard initialData={makeData(notices)} />);
    expect(screen.getByText(/02 개의 공지/)).toBeInTheDocument();
  });

  it("renders each notice as a link", () => {
    const notices = [makeNotice("abc", "첫번째 공지"), makeNotice("def", "두번째 공지")];
    render(<NoticeBoard initialData={makeData(notices)} />);
    expect(screen.getByRole("link", { name: /첫번째 공지/ })).toHaveAttribute("href", "/notice/abc");
    expect(screen.getByRole("link", { name: /두번째 공지/ })).toHaveAttribute("href", "/notice/def");
  });

  it("uses artistSlug in detail href", () => {
    const notices = [makeNotice("n1", "공지사항")];
    render(<NoticeBoard artistSlug="rescene" initialData={makeData(notices, "rescene")} />);
    expect(screen.getByRole("link", { name: /공지사항/ })).toHaveAttribute("href", "/rescene/notice/n1");
  });

  it("shows empty state when no notices", () => {
    render(<NoticeBoard initialData={makeData([])} />);
    expect(screen.getByText("조건에 맞는 공지가 없습니다.")).toBeInTheDocument();
  });

  it("shows error message when loadFailed is true", () => {
    render(<NoticeBoard initialData={null} loadFailed />);
    expect(screen.getByRole("alert")).toHaveTextContent("공지를 불러오지 못했습니다.");
  });

  it("filters notices by search input", () => {
    const notices = [
      makeNotice("1", "이벤트 공지"),
      makeNotice("2", "정기 점검 안내"),
    ];
    render(<NoticeBoard initialData={makeData(notices)} />);

    // The search button and the sr-only label span share the same text;
    // target the <button> element specifically.
    const searchButton = screen.getAllByLabelText("공지 검색").find(
      (el) => el.tagName === "BUTTON",
    )!;
    fireEvent.click(searchButton);
    const input = screen.getByPlaceholderText("공지 검색");
    fireEvent.change(input, { target: { value: "이벤트" } });

    expect(screen.getByRole("link", { name: /이벤트 공지/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /정기 점검/ })).toBeNull();
  });
});
