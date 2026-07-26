import Image from "next/image";
import type { RefObject } from "react";
import { LuCalendar, LuChevronLeft, LuChevronRight } from "react-icons/lu";

import type {
  AlbumSort,
  DiscographyAlbum,
  RailPhase,
} from "../lib/types";

interface AlbumDockProps {
  albumIndex: number;
  albums: DiscographyAlbum[];
  currentAlbum: DiscographyAlbum;
  railPhase: RailPhase;
  railRef: RefObject<HTMLDivElement | null>;
  sortBy: AlbumSort;
  onSelectAlbum: (index: number) => void;
  onToggleSort: () => void;
}

export function AlbumDock({
  albumIndex,
  albums,
  currentAlbum,
  railPhase,
  railRef,
  sortBy,
  onSelectAlbum,
  onToggleSort,
}: AlbumDockProps) {
  return (
    <div
      className="w-full py-3 border-t z-10 relative shrink-0"
      style={{
        backgroundColor: "var(--alpha-080808-65)",
        backdropFilter: "blur(24px) saturate(1.3)",
        borderColor: "var(--alpha-ffffff-04)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-8 flex items-center gap-3">
        <button
          onClick={onToggleSort}
          aria-label={
            sortBy === "date-desc"
              ? "날짜 오름차순으로 정렬"
              : "날짜 내림차순으로 정렬"
          }
          title={sortBy === "date-desc" ? "최신순" : "오래된순"}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border shrink-0 transition-all duration-base hover:border-[var(--alpha-ffffff-2)] hover:bg-[var(--alpha-ffffff-04)]"
          style={{
            borderColor: "var(--alpha-ffffff-08)",
            backgroundColor: "var(--alpha-ffffff-03)",
          }}
        >
          <LuCalendar
            className="w-3 h-3 text-[var(--palette-9ca3af)]"
            aria-hidden="true"
          />
          <span className="text-[8px] font-sans font-semibold tracking-wider text-[var(--palette-9ca3af)]">
            {sortBy === "date-desc" ? "최신순" : "오래된순"}
          </span>
        </button>

        <button
          onClick={() => onSelectAlbum(Math.max(albumIndex - 1, 0))}
          disabled={albumIndex === 0}
          aria-label="이전 앨범"
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-base hover:border-[var(--alpha-ffffff-2)] disabled:opacity-20 disabled:cursor-default"
          style={{
            borderColor: "var(--alpha-ffffff-08)",
            backgroundColor: "var(--alpha-ffffff-03)",
          }}
        >
          <LuChevronLeft
            className="w-4 h-4 text-[var(--color-static-white)]"
            aria-hidden="true"
          />
        </button>

        <div
          ref={railRef}
          className="discography-album-rail flex-1 flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1"
        >
          {albums.map((album, index) => {
            const isCurrent = index === albumIndex;
            return (
              <button
                key={album.id}
                onClick={() => onSelectAlbum(index)}
                data-album-index={index}
                aria-pressed={isCurrent}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl border shrink-0 group cursor-pointer hover:bg-[var(--alpha-ffffff-04)] active:scale-[0.97]"
                style={{
                  backgroundColor: isCurrent
                    ? "var(--alpha-ffffff-06)"
                    : undefined,
                  borderColor: isCurrent
                    ? currentAlbum.color
                    : "transparent",
                  ...(railPhase === "exit"
                    ? {
                        transform: "translateY(7px)",
                        opacity: 0,
                        transition: `transform var(--duration-fast) ease ${
                          index * 25
                        }ms, opacity 0.1s ease ${index * 25}ms`,
                      }
                    : railPhase === "enter"
                      ? {
                          animation: `slideInItem 0.22s cubic-bezier(0.34,1.56,0.64,1) ${
                            index * 28
                          }ms both`,
                        }
                      : {
                          transition: "all var(--duration-base) ease",
                        }),
                }}
              >
                <div
                  className="relative w-9 h-9 rounded-lg overflow-hidden border shrink-0 transition-all duration-base group-hover:border-[var(--alpha-ffffff-2)]"
                  style={{
                    borderColor: isCurrent
                      ? `${album.color}60`
                      : "var(--alpha-ffffff-06)",
                  }}
                >
                  <Image
                    src={album.cover}
                    alt={album.title}
                    fill
                    className="object-cover transition-transform duration-slow group-hover:scale-110"
                    sizes="40px"
                  />
                </div>
                <div className="text-left shrink-0 pr-1">
                  <p
                    className={`text-[10px] font-black leading-none tracking-tight transition-colors duration-base ${
                      isCurrent
                        ? "text-[var(--color-static-white)]"
                        : "text-[var(--palette-6b7280)] group-hover:text-[var(--palette-e5e7eb)]"
                    }`}
                  >
                    {album.title}
                  </p>
                  <p
                    className={`text-[7px] uppercase font-medium mt-0.5 tracking-wider transition-colors duration-base ${
                      isCurrent
                        ? "text-[var(--palette-9ca3af)]"
                        : "text-[var(--palette-4b5563)] group-hover:text-[var(--palette-6b7280)]"
                    }`}
                  >
                    {album.type}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() =>
            onSelectAlbum(Math.min(albumIndex + 1, albums.length - 1))
          }
          disabled={albumIndex === albums.length - 1}
          aria-label="다음 앨범"
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-base hover:border-[var(--alpha-ffffff-2)] disabled:opacity-20 disabled:cursor-default"
          style={{
            borderColor: "var(--alpha-ffffff-08)",
            backgroundColor: "var(--alpha-ffffff-03)",
          }}
        >
          <LuChevronRight
            className="w-4 h-4 text-[var(--color-static-white)]"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
