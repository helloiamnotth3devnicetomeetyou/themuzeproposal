import type { NextRequest } from "next/server";
import { updateSession } from "@/core/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/account", "/protect"],
};
