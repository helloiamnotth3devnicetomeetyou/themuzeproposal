import { getNavigationAccount } from "@/public/features/layout/server";

export async function GET() {
  return Response.json(await getNavigationAccount(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
