"use client";

import { type CSSProperties } from "react";
import { Plus, Search } from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import CustomSelect from "@/core/components/form/CustomSelect";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import {
  type HeroAlbum as Album,
  type HeroArtist as Artist,
} from "./HeroSlideCard";

export type HeroSortMode = "hero" | "newest" | "title";

type HeroAlbumCatalogProps = {
  artists: Artist[];
  matchingAlbums: Album[];
  artistById: Map<string, Artist>;
  selectedAlbumIds: Set<string>;
  artistId: string;
  query: string;
  sort: HeroSortMode;
  savingId: string | null;
  onArtistChange: (artistId: string) => void;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: HeroSortMode) => void;
  onAdd: (album: Album) => void;
};

export default function HeroAlbumCatalog({
  artists,
  matchingAlbums,
  artistById,
  selectedAlbumIds,
  artistId,
  query,
  sort,
  savingId,
  onArtistChange,
  onQueryChange,
  onSortChange,
  onAdd,
}: HeroAlbumCatalogProps) {
  return (
    <section className="hero-admin-panel hero-admin-catalog">
      <div className="hero-admin-panel-heading">
        <div>
          <h3>앨범 라이브러리</h3>
          <p>현재 공개 중인 앨범만 메인 목록에 추가할 수 있습니다.</p>
        </div>
        <em>{matchingAlbums.length}개 앨범</em>
      </div>
      <div className="hero-admin-filters">
        <label className="hero-admin-search">
          <Search aria-hidden="true" />
          <span className="sr-only">앨범 검색</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="앨범명 또는 아티스트 검색"
          />
        </label>
        <CustomSelect
          ariaLabel="아티스트 선택"
          value={artistId}
          onChange={onArtistChange}
          options={[
            { value: "all", label: "모든 아티스트" },
            ...artists.map((artist) => ({
              value: artist.id,
              label: artist.name,
            })),
          ]}
        />
        <CustomSelect
          ariaLabel="정렬 방식"
          value={sort}
          onChange={(value) => onSortChange(value as HeroSortMode)}
          options={[
            { value: "hero", label: "메인 노출 순서" },
            { value: "newest", label: "발매일 최신순" },
            { value: "title", label: "앨범명 가나다순" },
          ]}
        />
      </div>
      <div className="hero-admin-catalog-grid">
        {matchingAlbums.map((album) => {
          const artist = artistById.get(album.artist_id);
          const selected = selectedAlbumIds.has(album.id);
          return (
            <article
              key={album.id}
              className={`hero-admin-catalog-item ${selected ? "is-selected" : ""}`}
            >
              <span
                className="hero-admin-catalog-cover"
                style={
                  {
                    "--album-color":
                      album.color || artist?.color || BRAND_PINK_HEX,
                  } as CSSProperties
                }
              >
                {album.cover_url ? (
                  <AdminAssetImage src={album.cover_url} alt="" sizes="64px" />
                ) : (
                  <i />
                )}
              </span>
              <div>
                <b>{album.title}</b>
                <small>
                  {artist?.name || "THE MUZE"} · {album.type}
                </small>
                <em>{album.release_date || "발매일 미정"}</em>
              </div>
              <button
                type="button"
                data-tour-id="hero-add"
                disabled={selected || savingId === album.id}
                onClick={() => onAdd(album)}
              >
                {selected ? (
                  <span>추가됨</span>
                ) : (
                  <>
                    <Plus aria-hidden="true" />
                    <span>메인에 추가</span>
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>
      {!matchingAlbums.length && (
        <div className="hero-admin-empty is-compact">
          <Search aria-hidden="true" />
          <b>조건에 맞는 공개 앨범이 없습니다.</b>
          <span>검색어나 아티스트 필터를 바꿔 보세요.</span>
        </div>
      )}
    </section>
  );
}
