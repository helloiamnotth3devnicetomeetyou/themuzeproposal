"use client";

import { ChevronDown, ChevronUp, GripVertical, Plus } from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import type { AlbumEditorDraft } from "@/core/utils/music-editor";
import type { DiscographyFilter } from "./useDiscographyEditor";

type Props = {
  albums: AlbumEditorDraft[];
  draft: AlbumEditorDraft | null;
  visibleAlbums: AlbumEditorDraft[];
  search: string;
  filter: DiscographyFilter;
  sorting: boolean;
  sortDirty: boolean;
  onAddAlbum: () => void | Promise<void>;
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: DiscographyFilter) => void;
  onToggleSorting: () => void;
  onDragAlbum: (albumId: string) => void;
  onReorderAlbum: (targetId: string, sourceId?: string) => void;
  onSaveOrder: () => void | Promise<void>;
  onSelectAlbum: (album: AlbumEditorDraft) => void | Promise<void>;
};

export default function DiscographyContextRail({
  albums,
  draft,
  visibleAlbums,
  search,
  filter,
  sorting,
  sortDirty,
  onAddAlbum,
  onSearchChange,
  onFilterChange,
  onToggleSorting,
  onDragAlbum,
  onReorderAlbum,
  onSaveOrder,
  onSelectAlbum,
}: Props) {
  return (
    <>
      <div className="music-library-heading" data-tour-id="entity-create">
        <div>
          <h2>앨범 라이브러리</h2>
        </div>
        <button
          type="button"
          onClick={() => void onAddAlbum()}
          aria-label="새 앨범"
        >
          <Plus aria-hidden="true" />
        </button>
      </div>
      <div className="music-library-tools">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="앨범 검색"
          aria-label="앨범 검색"
        />
        <div className="music-filter-row">
          {(["all", "published", "draft"] as DiscographyFilter[]).map(
            (item) => (
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
                    : "초안"}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="music-sort-row" data-tour-id="album-sort">
        <span>{visibleAlbums.length}개 앨범</span>
        <button type="button" onClick={onToggleSorting}>
          {sorting ? "정렬 종료" : "순서 변경"}
        </button>
      </div>
      <div className="music-album-list">
        {visibleAlbums.map((album, index) => (
          <div
            key={album.id}
            className={`music-album-row ${sorting ? "is-sorting" : ""}`}
          >
            <button
              type="button"
              data-tour-id="entity-list-item"
              draggable={sorting}
              onDragStart={() => onDragAlbum(album.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onReorderAlbum(album.id)}
              onClick={() => !sorting && void onSelectAlbum(album)}
              className={`music-album-item ${draft?.id === album.id ? "is-selected" : ""} ${sorting ? "is-sorting" : ""}`}
            >
              <span className="music-album-grip">
                {sorting ? (
                  <GripVertical aria-hidden="true" />
                ) : (
                  String(albums.indexOf(album) + 1).padStart(2, "0")
                )}
              </span>
              <span className="music-album-cover">
                {album.cover_url ? (
                  <AdminAssetImage src={album.cover_url} alt="" sizes="56px" />
                ) : (
                  <i />
                )}
              </span>
              <span className="music-album-copy">
                <b>{album.title}</b>
                <small>
                  {album.type} · {album.tracks.length}곡
                </small>
              </span>
              <span
                className={`cms-status ${album.is_published ? "is-live" : ""}`}
              >
                {album.is_published ? "공개" : "초안"}
              </span>
            </button>
            {sorting && (
              <div className="music-album-move-controls">
                <button
                  type="button"
                  disabled={index === 0}
                  aria-label={`${album.title} 위로 이동`}
                  onClick={() =>
                    onReorderAlbum(visibleAlbums[index - 1].id, album.id)
                  }
                >
                  <ChevronUp aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={index === visibleAlbums.length - 1}
                  aria-label={`${album.title} 아래로 이동`}
                  onClick={() =>
                    onReorderAlbum(visibleAlbums[index + 1].id, album.id)
                  }
                >
                  <ChevronDown aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        ))}
        {!visibleAlbums.length && (
          <div className="music-empty">
            <b>표시할 앨범이 없습니다.</b>
            <span>검색 조건을 바꾸거나 새 앨범을 추가해 보세요.</span>
          </div>
        )}
      </div>
      {sorting && sortDirty && (
        <div className="music-order-footer">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => void onSaveOrder()}
          >
            순서 저장
          </button>
        </div>
      )}
    </>
  );
}
