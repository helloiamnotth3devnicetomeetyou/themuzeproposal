"use client";

import GalleryManagerView from "./GalleryManagerView";
import type { GalleryManagerProps } from "./gallery-manager-types";
import { useGalleryManager } from "./useGalleryManager";

export default function GalleryManager(props: GalleryManagerProps) {
  const state = useGalleryManager(props);
  return <GalleryManagerView {...props} {...state} />;
}
