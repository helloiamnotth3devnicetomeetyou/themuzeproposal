"use client";

import type { NoticeDraft } from "./notice-editor-model";
import type { Notice, NoticeFilter } from "./notice-manager-types";
import { Plus } from "lucide-react";

type NoticeManagerRailProps = {
  scopeArtistId?: string;
  scopeName: string;
  visibleNotices: Notice[];
  draft: NoticeDraft | null;
  search: string;
  filter: NoticeFilter;
  onAdd: () => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: NoticeFilter) => void;
  onSelect: (notice: Notice) => void;
};

export default function NoticeManagerRail({
  scopeArtistId,
  scopeName,
  visibleNotices,
  draft,
  search,
  filter,
  onAdd,
  onSearchChange,
  onFilterChange,
  onSelect,
}: NoticeManagerRailProps) {
  return (
    <>
      <div className="content-rail-heading" data-tour-id="notice-create">
        <div>
          <h2>{scopeArtistId ? "아티스트 공지" : "전체 공지"}</h2>
        </div>
        <button type="button" onClick={onAdd} aria-label="공지 작성">
          <Plus aria-hidden="true" />
        </button>
      </div>
      <div className="content-rail-tools" data-tour-id="notice-filters">
        <input
          data-tour-id="notice-search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="공지 검색"
          aria-label="공지 검색"
        />
        <div className="content-filter-row" data-tour-id="notice-status-filter">
          {(["all", "published", "draft"] as NoticeFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "is-active" : ""}
              onClick={() => onFilterChange(item)}
            >
              {item === "all"
                ? "전체"
                : item === "published"
                  ? "공개"
                  : "비공개"}
            </button>
          ))}
        </div>
      </div>
      <div className="content-rail-sort">
        <span>{visibleNotices.length}개 공지</span>
        <small>{scopeName}</small>
      </div>
      <div className="content-library-list notice-library-list">
        {draft && !draft.id && (
          <button
            type="button"
            className="content-library-item notice-library-item is-selected"
          >
            <span className="notice-library-date">
              <b>NEW</b>
              <small>{draft.date.slice(5).replace("-", ".")}</small>
            </span>
            <span className="content-library-copy">
              <b>{draft.titleKo || "새 공지"}</b>
              <small>
                {draft.categoryKo} · {draft.published ? "공개 예정" : "비공개"}
              </small>
            </span>
          </button>
        )}
        {visibleNotices.map((notice) => (
          <button
            key={notice.id}
            type="button"
            data-tour-id="entity-list-item"
            onClick={() => onSelect(notice)}
            className={`content-library-item notice-library-item ${draft?.id === notice.id ? "is-selected" : ""}`}
          >
            <span className="notice-library-date">
              <b>{notice.date.slice(0, 4)}</b>
              <small>{notice.date.slice(5).replace("-", ".")}</small>
            </span>
            <span className="content-library-copy">
              <b>{notice.title_ko}</b>
              <small>
                {notice.category_ko} · {notice.is_published ? "공개" : "비공개"}
              </small>
            </span>
            <span
              className={`content-library-dot ${notice.is_published ? "is-live" : ""}`}
            />
          </button>
        ))}
        {!visibleNotices.length && !draft?.id && (
          <div className="content-library-empty">
            <b>표시할 공지가 없습니다.</b>
            <span>검색 조건을 바꾸거나 새 공지를 작성하세요.</span>
          </div>
        )}
      </div>
    </>
  );
}
