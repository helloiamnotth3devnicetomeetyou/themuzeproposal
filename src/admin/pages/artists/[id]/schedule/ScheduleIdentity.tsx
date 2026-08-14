import styles from "@/styles/(admin)/pages/artist-schedule/schedule-admin.module.css";
import type { ScheduleDraft } from "./schedule-editor-model";

interface ScheduleIdentityProps {
  artistName: string;
  draft: ScheduleDraft | null;
}

export default function ScheduleIdentity({
  artistName,
  draft,
}: ScheduleIdentityProps) {
  return draft ? (
    <>
      <span className={styles.dateArt}>
        <b>{draft.eventDate ? draft.eventDate.slice(8, 10) : "--"}</b>
        <small>{draft.eventDate ? draft.eventDate.slice(5, 7) : "DATE"}</small>
      </span>
      <div className="content-identity-copy">
        <p>
          <span className={`cms-status ${draft.isPublished ? "is-live" : ""}`}>
            {draft.isPublished ? "공개" : "비공개"}
          </span>
        </p>
        <h2>{draft.titleKo || "이름 없는 일정"}</h2>
        <small>{artistName}</small>
      </div>
    </>
  ) : (
    <div className="content-identity-copy">
      <p>
        <span className="cms-status">선택 안 됨</span>
      </p>
      <h2>일정을 선택하세요</h2>
      <small>{artistName}</small>
    </div>
  );
}
