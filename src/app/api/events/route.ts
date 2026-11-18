import { NextResponse, type NextRequest } from "next/server";
import { publicStore } from "@/lib/store";
import { isLang } from "@/lib/i18n";
import type { EventType } from "@/lib/types";

const TYPES: EventType[] = ["view_home", "view_category", "view_item", "search"];

// Tiny per-instance limiter so a single client can't flood the table.
const hits = new Map<string, { n: number; at: number }>();
function limited(key: string) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.at > 60_000) {
    hits.set(key, { n: 1, at: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n++;
  return h.n > 60;
}

/** Cookie-free analytics beacon. Stores no IP or personal data. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return new NextResponse(null, { status: 429 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const type = body.type as EventType;
    if (!TYPES.includes(type)) return new NextResponse(null, { status: 400 });
    const ref = typeof body.ref === "string" ? body.ref.slice(0, 80) : null;
    const lang = isLang(body.lang) ? body.lang : null;
    const currency = typeof body.currency === "string" && /^[A-Z]{3}$/.test(body.currency) ? body.currency : null;
    await publicStore().insert("events", { type, ref, lang, currency });
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}
