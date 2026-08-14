import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { sanitizeRichText } from "@/core/utils/rich-text";
import type { ArtistScene } from "@/core/utils/artist-scenes";
import type { Member, SceneCopy } from "./artist-scene-types";
import { getEnglishFirstMemberName } from "./artist-scene-types";
import styles from "@/styles/(public)/pages/artist-scene.module.css";
import inlineMemberStyles from "@/styles/(public)/pages/artist-scene-inline-member.module.css";

type Props = {
  scenes: ArtistScene[];
  activeIndex: number;
  activeMembers: Member[];
  selectedMember: Member | null;
  memberBio: string;
  groupBio: string;
  copy: SceneCopy;
  onChangeScene: (id: string) => void;
  onSelectMember: (id: string) => void;
  onCloseMember: () => void;
  onNavigateMember: (direction: -1 | 1) => void;
};

export default function MobileSceneControls({
  scenes,
  activeIndex,
  activeMembers,
  selectedMember,
  memberBio,
  groupBio,
  copy,
  onChangeScene,
  onSelectMember,
  onCloseMember,
  onNavigateMember,
}: Props) {
  return (
    <section className={styles.mobileSceneControls} aria-label={copy.select}>
      {selectedMember ? (
        <div className={inlineMemberStyles.mobileInlineMemberPanel}>
          <div className={inlineMemberStyles.mobileInlineMemberHeader}>
            <div>
              <h2>{getEnglishFirstMemberName(selectedMember)}</h2>
              {selectedMember.name !==
                getEnglishFirstMemberName(selectedMember) && (
                <p>{selectedMember.name}</p>
              )}
            </div>
            <button
              type="button"
              className={inlineMemberStyles.mobileInlineClose}
              onClick={onCloseMember}
              aria-label={copy.close}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          {memberBio && (
            <p className={inlineMemberStyles.mobileInlineMemberBio}>
              {memberBio}
            </p>
          )}
          <div className={inlineMemberStyles.mobileInlineSheetNavigation}>
            <button type="button" onClick={() => onNavigateMember(-1)}>
              <ArrowLeft aria-hidden="true" />
              {copy.previous}
            </button>
            <button type="button" onClick={() => onNavigateMember(1)}>
              {copy.next}
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.mobileSceneNavigator}>
            <div className={styles.mobileFilmCounter}>
              <span>{String(activeIndex + 1).padStart(2, "0")}</span>
              <div>
                <i
                  style={{
                    width: `${((activeIndex + 1) / Math.max(1, scenes.length)) * 100}%`,
                  }}
                />
              </div>
              <span>{String(scenes.length).padStart(2, "0")}</span>
            </div>
            <div className={styles.mobileSceneActions}>
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() =>
                  onChangeScene(scenes[Math.max(0, activeIndex - 1)].id)
                }
                aria-label={copy.previous}
              >
                <ArrowLeft aria-hidden="true" />
              </button>
              <span aria-hidden="true" />
              <button
                type="button"
                disabled={activeIndex === scenes.length - 1}
                onClick={() =>
                  onChangeScene(
                    scenes[Math.min(scenes.length - 1, activeIndex + 1)].id,
                  )
                }
                aria-label={copy.next}
              >
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className={styles.mobileMemberChips}>
            {activeMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectMember(member.id)}
              >
                {member.image_url && (
                  <Image src={member.image_url} alt="" width={32} height={32} />
                )}
                <span>{getEnglishFirstMemberName(member)}</span>
              </button>
            ))}
          </div>
          {groupBio && (
            <div className={styles.mobileGroupBio}>
              <strong>{copy.groupProfile}</strong>
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichText(groupBio),
                }}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
