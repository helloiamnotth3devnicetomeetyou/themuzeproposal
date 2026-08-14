import { accountCopy } from "./account-copy";

export type AccountCopy = (typeof accountCopy)[keyof typeof accountCopy];
export type Status = { type: "success" | "error"; message: string } | null;
export type AccountSection =
  "profile" | "avatar" | "email" | "password" | "session";
export type SavingAction =
  "name" | "avatar" | "email" | "password" | "logout" | null;

export type AccountSectionMeta = {
  id: AccountSection;
  label: string;
  description: string;
  code: string;
};

export type AvatarArtistOption = {
  id: string;
  name: string;
  avatars: Array<{ id: string; imageUrl: string }>;
};
