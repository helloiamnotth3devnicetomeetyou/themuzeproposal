import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { AlbumSort, RailPhase } from "@/public/features/discography/types";

export function useDiscographyRailSort({
  railPhase,
  albumCount,
  railTimersRef,
  setRailPhase,
  setSortBy,
  setAlbumIndex,
}: {
  railPhase: RailPhase;
  albumCount: number;
  railTimersRef: RefObject<Array<ReturnType<typeof setTimeout>>>;
  setRailPhase: (value: RailPhase) => void;
  setSortBy: Dispatch<SetStateAction<AlbumSort>>;
  setAlbumIndex: (value: number) => void;
}) {
  return useCallback(() => {
    if (railPhase !== "idle") return;
    const exitTime = 80 + albumCount * 28;
    const enterTime = 220 + albumCount * 28;
    setRailPhase("exit");
    const exitTimer = setTimeout(() => {
      setSortBy((previous) =>
        previous === "date-desc" ? "date-asc" : "date-desc",
      );
      setAlbumIndex(0);
      setRailPhase("enter");
      railTimersRef.current.push(
        setTimeout(() => setRailPhase("idle"), enterTime),
      );
    }, exitTime);
    railTimersRef.current.push(exitTimer);
  }, [
    albumCount,
    railPhase,
    railTimersRef,
    setAlbumIndex,
    setRailPhase,
    setSortBy,
  ]);
}
