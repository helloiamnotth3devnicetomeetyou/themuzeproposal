import Image from "next/image";
import { Image as LucideImage } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import type { DiscographyMember } from "@/public/features/discography/types";

type Props = {
  albumColor: string;
  selectedMemberId: string;
  selectedMember: DiscographyMember | null;
  members: DiscographyMember[];
  photoCounts: Map<string, number>;
  totalPhotos: number;
  filteredPhotos: number;
  onSelect: (memberId: string) => void;
};

export function MemberGalleryFilters({
  albumColor,
  selectedMemberId,
  selectedMember,
  members,
  photoCounts,
  totalPhotos,
  filteredPhotos,
  onSelect,
}: Props) {
  const { t } = useLocale();
  const selected = (id: string) => selectedMemberId === id;
  const chipStyle = (id: string) => ({
    borderColor: selected(id) ? albumColor : "var(--alpha-ffffff-1)",
    backgroundColor: selected(id)
      ? `${albumColor}28`
      : "var(--alpha-ffffff-03)",
    color: selected(id) ? "var(--color-static-white)" : "var(--palette-9ca3af)",
    boxShadow: selected(id) ? `0 0 14px ${albumColor}35` : "none",
  });

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className="px-3 py-1.2 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5 shrink-0 border"
          style={chipStyle("all")}
        >
          <LucideImage
            className="w-3.5 h-3.5"
            style={{ color: selected("all") ? albumColor : "inherit" }}
          />
          <span>{t.discography.allMembers}</span>
          <span
            className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold"
            style={{
              backgroundColor: selected("all")
                ? albumColor
                : "var(--alpha-ffffff-1)",
              color: selected("all") ? "#000" : "var(--palette-9ca3af)",
            }}
          >
            {totalPhotos}
          </span>
        </button>
        {members.map((member) => {
          const isSelected = selected(member.id);
          const count = photoCounts.get(member.id) || 0;
          return (
            <button
              type="button"
              key={member.id}
              onClick={() => onSelect(member.id)}
              className="px-3 py-1.2 rounded-full text-xs font-semibold transition-all duration-300 flex items-center gap-2 shrink-0 border"
              style={chipStyle(member.id)}
            >
              {member.imageUrl ? (
                <div
                  className="w-4.5 h-4.5 rounded-full overflow-hidden relative shrink-0 border"
                  style={{
                    borderColor: isSelected
                      ? albumColor
                      : member.color || albumColor,
                  }}
                >
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="18px"
                  />
                </div>
              ) : (
                <div
                  className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                  style={{
                    backgroundColor: member.color || albumColor,
                    color: "#000",
                  }}
                >
                  {member.name.slice(0, 1)}
                </div>
              )}
              <span className="truncate max-w-[90px]">{member.name}</span>
              {count > 0 && (
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded-full font-bold"
                  style={{
                    backgroundColor: isSelected
                      ? albumColor
                      : "var(--alpha-ffffff-1)",
                    color: isSelected ? "#000" : "var(--palette-9ca3af)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selectedMember && (
        <div
          className="px-3.5 py-2 rounded-xl flex items-center justify-between shrink-0 border backdrop-blur-md"
          style={{
            backgroundColor: `${albumColor}12`,
            borderColor: `${albumColor}30`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedMember.imageUrl ? (
              <div
                className="w-7 h-7 rounded-full overflow-hidden relative border-2 shrink-0"
                style={{ borderColor: albumColor }}
              >
                <Image
                  src={selectedMember.imageUrl}
                  alt={selectedMember.name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                style={{ backgroundColor: albumColor, color: "#000" }}
              >
                {selectedMember.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex items-center gap-2">
              <h4 className="text-xs font-bold text-[var(--color-static-white)] truncate">
                {selectedMember.name}
              </h4>
              <span
                className="text-[8px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider text-black"
                style={{ backgroundColor: albumColor }}
              >
                {selectedMember.role || "MEMBER"}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-[var(--palette-9ca3af)] font-mono">
            {filteredPhotos} {t.discography.photoCount}
          </span>
        </div>
      )}
    </>
  );
}
