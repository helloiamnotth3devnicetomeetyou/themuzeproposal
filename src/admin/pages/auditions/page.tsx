"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Settings2 } from "lucide-react";
import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";
import { supabase } from "@/core/supabase/client";
import { SettingsTab } from "./SettingsTab";
import { InboxTab } from "./InboxTab";
import {
  AUDITION_STATUS_LABEL,
  type AuditionField,
  type AuditionSession,
  type AuditionStatus,
} from "./audition-editor-model";

type Tab = "settings" | "inbox";

function AuditionStatusBadge({ status }: { status: AuditionStatus | null }) {
  if (!status) return null;
  return (
    <span className={`audition-session-badge is-${status}`}>
      {AUDITION_STATUS_LABEL[status]}
    </span>
  );
}

import { notFound } from "next/navigation";

export default function AuditionsAdmin() {
  notFound();
}
