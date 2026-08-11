import { NextResponse } from "next/server";
import { getNavigationAccount } from "@/public/features/layout/server";

export async function GET() {
  const response = NextResponse.json(await getNavigationAccount());
  response.headers.set("Cache-Control", "no-store");
  return response;
}
