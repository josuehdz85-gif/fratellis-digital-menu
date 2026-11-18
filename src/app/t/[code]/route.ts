import { NextResponse, type NextRequest } from "next/server";
import { publicStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Target of every table QR code: counts the scan, then opens the menu. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const store = publicStore();
  try {
    if (/^[a-z0-9-]{1,40}$/i.test(code) && (await store.incrementScan(code))) {
      await store.insert("events", { type: "scan", ref: code, lang: null, currency: null });
    }
  } catch {
    /* never block the diner */
  }
  return NextResponse.redirect(new URL("/", req.url), 307);
}
