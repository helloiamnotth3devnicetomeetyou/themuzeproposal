import { useCallback, type RefObject, type PointerEvent } from "react";
import { getSnappedGuidePosition } from "./guide-position";

export function useGuidePopoverInteractions({
  dialogRef,
  popoverDragRef,
  mobileSheetDragRef,
  suppressMobileSheetClickRef,
  mobileSheetExpanded,
  setManualPopoverPosition,
  setIsPopoverDragging,
  setMobileSheetExpanded,
}: {
  dialogRef: RefObject<HTMLDivElement | null>;
  popoverDragRef: RefObject<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>;
  mobileSheetDragRef: RefObject<number | null>;
  suppressMobileSheetClickRef: RefObject<boolean>;
  mobileSheetExpanded: boolean;
  setManualPopoverPosition: (
    value: { top: number; left: number } | null,
  ) => void;
  setIsPopoverDragging: (value: boolean) => void;
  setMobileSheetExpanded: (value: boolean) => void;
}) {
  const startPopoverDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (
        window.innerWidth <= 700 ||
        event.button !== 0 ||
        (event.target as HTMLElement).closest("button")
      )
        return;
      const bounds = dialogRef.current?.getBoundingClientRect();
      if (!bounds) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      popoverDragRef.current = {
        pointerId: event.pointerId,
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
      setManualPopoverPosition({ top: bounds.top, left: bounds.left });
      setIsPopoverDragging(true);
    },
    [dialogRef, popoverDragRef, setIsPopoverDragging, setManualPopoverPosition],
  );
  const movePopover = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const drag = popoverDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      setManualPopoverPosition(
        getSnappedGuidePosition(
          {
            top: event.clientY - drag.offsetY,
            left: event.clientX - drag.offsetX,
          },
          { width: drag.width, height: drag.height },
          { width: window.innerWidth, height: window.innerHeight },
        ),
      );
    },
    [popoverDragRef, setManualPopoverPosition],
  );
  const stopPopoverDrag = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (popoverDragRef.current?.pointerId !== event.pointerId) return;
      popoverDragRef.current = null;
      setIsPopoverDragging(false);
    },
    [popoverDragRef, setIsPopoverDragging],
  );
  const updateMobileSheet = useCallback(
    (expanded: boolean) => {
      setMobileSheetExpanded(expanded);
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          window.dispatchEvent(new Event("admin-guide-reveal-target")),
        ),
      );
    },
    [setMobileSheetExpanded],
  );
  const startMobileSheetDrag = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      mobileSheetDragRef.current = event.clientY;
    },
    [mobileSheetDragRef],
  );
  const stopMobileSheetDrag = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const startY = mobileSheetDragRef.current;
      mobileSheetDragRef.current = null;
      if (startY === null) return;
      const distance = event.clientY - startY;
      if (Math.abs(distance) < 32) return;
      suppressMobileSheetClickRef.current = true;
      updateMobileSheet(distance < 0);
    },
    [mobileSheetDragRef, suppressMobileSheetClickRef, updateMobileSheet],
  );
  const toggleMobileSheet = useCallback(() => {
    if (suppressMobileSheetClickRef.current) {
      suppressMobileSheetClickRef.current = false;
      return;
    }
    updateMobileSheet(!mobileSheetExpanded);
  }, [mobileSheetExpanded, suppressMobileSheetClickRef, updateMobileSheet]);
  return {
    startPopoverDrag,
    movePopover,
    stopPopoverDrag,
    updateMobileSheet,
    startMobileSheetDrag,
    stopMobileSheetDrag,
    toggleMobileSheet,
  };
}
