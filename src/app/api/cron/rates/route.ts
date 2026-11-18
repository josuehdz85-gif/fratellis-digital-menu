import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { systemStore } from "@/lib/store";
import { refreshRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

/** Scheduled exchange-rate refresh (Vercel Cron). Protected by CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }
  const store = systemStore();
  if (!store) return NextResponse.json({ error: "SUPABASE_SECRET_KEY not set" }, { status: 500 });
  const result = await refreshRates(store);
  if (result.updated.length) revalidatePath("/", "layout");
  return NextResponse.json(result, { status: result.error ? 502 : 200 });
}
