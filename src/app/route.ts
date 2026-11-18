import { NextResponse, type NextRequest } from "next/server";
import { isLang, pickLang } from "@/lib/i18n";
import { publicStore } from "@/lib/store";
import type { Lang } from "@/lib/types";

export const dynamic = "force-dynamic";

/** "/" picks the diner's language: saved choice → phone language → restaurant default. */
export async function GET(req: NextRequest) {
  let enabled: Lang[] = ["en", "es"];
  let fallback: Lang = "en";
  try {
    const r = await publicStore().get("restaurant", 1);
    if (r) {
      enabled = r.enabled_languages;
      fallback = r.default_language;
    }
  } catch {
    /* fall through with defaults */
  }
  const saved = req.cookies.get("lang")?.value;
  const lang = isLang(saved) && enabled.includes(saved) ? saved : pickLang(req.headers.get("accept-language"), enabled, fallback);
  const res = NextResponse.redirect(new URL(`/${lang}`, req.url), 307);
  res.headers.set("Vary", "Accept-Language, Cookie");
  return res;
}
