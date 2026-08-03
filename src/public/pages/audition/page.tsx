import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { createPrivatePageMetadata } from "@/core/seo/metadata";
import AuditionFormClient from "./AuditionFormClient";
import AuditionClosedView from "./AuditionClosedView";
import type { AuditionSession } from "@/admin/pages/auditions/audition-editor-model";
import styles from "@/styles/(public)/pages/audition.module.css";

export const metadata: Metadata = createPrivatePageMetadata("Audition");

export default async function AuditionPage() {
  return <AuditionClosedView status={null} title={undefined} endAt={undefined} />;
}
