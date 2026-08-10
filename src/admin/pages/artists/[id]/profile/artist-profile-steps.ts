export type NewArtistStep = "name" | "visual" | "content" | "done";
export const newArtistSteps: Array<{ id: NewArtistStep; label: string }> = [
  { id: "name", label: "이름" }, { id: "visual", label: "비주얼" }, { id: "content", label: "소개" }, { id: "done", label: "완료" },
];
