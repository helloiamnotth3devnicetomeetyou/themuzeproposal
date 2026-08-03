import Image from "next/image";
import { Image as LucideImage, Maximize2 } from "lucide-react";
import { useLocale } from "@/core/providers/LocaleContext";
import type { DiscographyAlbum, DiscographyGalleryItem, DiscographyMember } from "../lib/types";

function bentoSpan(index: number, total: number) {
  if (total === 1) return "col-span-2 row-span-2";
  if (total === 2) return index === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-2";
  return ["col-span-2 row-span-2", "col-span-1 row-span-2", "col-span-2 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-2", "col-span-2 row-span-1", "col-span-1 row-span-1", "col-span-1 row-span-1"][index % 8];
}

type Props = { album: DiscographyAlbum; albumColor: string; gallery: DiscographyGalleryItem[]; members: Map<string, DiscographyMember>; showMember: boolean; onOpen: (index: number) => void };

export function MemberGalleryGrid({ album, albumColor, gallery, members, showMember, onOpen }: Props) {
  const { t } = useLocale();
  if (!gallery.length) return <div className="h-full min-h-[180px] rounded-2xl flex flex-col items-center justify-center p-6 text-center border" style={{ backgroundColor: `${albumColor}08`, borderColor: `${albumColor}18` }}><LucideImage className="w-9 h-9 mb-2 opacity-40" style={{ color: albumColor }} /><p className="text-xs text-[var(--palette-9ca3af)]">{t.discography.noPhotos}</p></div>;
  return <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 auto-rows-[75px] sm:auto-rows-[90px] md:auto-rows-[100px] gap-2 grid-flow-dense pb-4">
    {gallery.map((item, index) => {
      const member = item.memberId ? members.get(item.memberId) : null;
      return <button type="button" key={item.id} onClick={() => onOpen(index)} className={`group relative rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 hover:z-20 hover:scale-[1.03] ${bentoSpan(index, gallery.length)}`} style={{ backgroundColor: `${albumColor}10`, borderColor: `${albumColor}25` }}>
        <Image src={item.imageUrl} alt={item.caption || album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw" />
        <div className="absolute inset-0 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 pointer-events-none" style={{ boxShadow: `inset 0 0 0 2px ${albumColor}, 0 6px 20px ${albumColor}35` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--alpha-000000-85)] via-[var(--alpha-000000-2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
          <div className="flex justify-between items-start">{showMember && member ? <span className="px-1.5 py-0.2 rounded-full text-[8px] font-bold text-black shadow-md backdrop-blur-sm" style={{ backgroundColor: albumColor }}>{member.name}</span> : <span />}<span className="w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-md text-[var(--color-static-white)]" style={{ backgroundColor: `${albumColor}50` }}><Maximize2 className="w-2.5 h-2.5" /></span></div>
          {item.caption && <p className="text-[10px] text-[var(--color-static-white)] font-medium truncate drop-shadow-md">{item.caption}</p>}
        </div>
      </button>;
    })}
  </div>;
}
