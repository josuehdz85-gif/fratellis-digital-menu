import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { UPLOAD_DIR } from "@/lib/store/local";

/** Serves photos uploaded in local demo mode (Supabase Storage is used in production). */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const file = path.join(UPLOAD_DIR, ...parts);
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return new NextResponse(null, { status: 400 });
  try {
    const data = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    const type = ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg";
    return new NextResponse(new Uint8Array(data), {
      headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
