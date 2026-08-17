import { ArrowLeft, ArrowRight, X } from "lucide-react";
import {
  getEnglishFirstMemberName,
  type Member,
  type SceneCopy,
} from "@/public/features/artists/types";
import styles from "@/styles/(public)/pages/artist-scene.module.css";

export default function MemberDetailOverlay({
  member,
  memberBio,
  panelLeft,
  copy,
  onClose,
  onNavigate,
}: {
  member: Member | null;
  memberBio: string;
  panelLeft: boolean;
  copy: SceneCopy;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}) {
  const memberName = member ? getEnglishFirstMemberName(member) : "";
  if (member)
    return (
      <aside
        key={member.id}
        className={`${styles.profilePanel} ${panelLeft ? styles.panelLeft : styles.panelRight}`}
        aria-live="polite"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={copy.close}
        >
          <X aria-hidden="true" />
        </button>
        <h1>{memberName}</h1>
        {member.name !== memberName && (
          <p className={styles.nativeName}>{member.name}</p>
        )}
        <div className={styles.memberBio}>
          <p>{memberBio}</p>
        </div>
        <div className={styles.memberArrows}>
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            aria-label={copy.previous}
          >
            <ArrowLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate(1)}
            aria-label={copy.next}
          >
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </aside>
    );
  return null;
}
