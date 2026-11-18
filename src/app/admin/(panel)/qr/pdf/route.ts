import { promises as fs } from "fs";
import path from "path";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { adminStore } from "@/lib/store";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

const INK = rgb(0.14, 0.09, 0.06);
const RED = rgb(0.72, 0.15, 0.17);

async function loadLogo(url: string | null): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    if (url.startsWith("/")) return new Uint8Array(await fs.readFile(path.join(process.cwd(), "public", url)));
    const res = await fetch(url);
    return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** Print-ready PDF of table QR codes: "tent" (2 per Letter page) or "sticker" (12 per page). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "staff") return new NextResponse("Unauthorized", { status: 401 });

  const format = req.nextUrl.searchParams.get("format") === "sticker" ? "sticker" : "tent";
  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean);
  const store = await adminStore();
  const [allTables, restaurant] = await Promise.all([store.list("tables", { order: "created_at" }), store.get("restaurant", 1)]);
  const tables = ids?.length ? allTables.filter((t) => ids.includes(t.id)) : allTables;
  if (!tables.length) return new NextResponse("No tables", { status: 404 });

  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const logoBytes = await loadLogo(restaurant?.logo_url ?? null);
  let logo: PDFImage | null = null;
  if (logoBytes) {
    try {
      logo = await pdf.embedPng(logoBytes);
    } catch {
      try {
        logo = await pdf.embedJpg(logoBytes);
      } catch {
        logo = null;
      }
    }
  }

  const qrImages = await Promise.all(
    tables.map(async (t) => pdf.embedPng(await QRCode.toBuffer(`${SITE_URL}/t/${t.code}`, { errorCorrectionLevel: "H", margin: 1, width: 800 }))),
  );

  const drawQr = (page: ReturnType<typeof pdf.addPage>, img: PDFImage, x: number, y: number, size: number) => {
    page.drawImage(img, { x, y, width: size, height: size });
    if (logo) {
      const box = size * 0.26;
      page.drawRectangle({ x: x + (size - box) / 2 - 3, y: y + (size - box) / 2 - 3, width: box + 6, height: box + 6, color: rgb(1, 1, 1) });
      const s = logo.scaleToFit(box, box);
      page.drawImage(logo, { x: x + (size - s.width) / 2, y: y + (size - s.height) / 2, width: s.width, height: s.height });
    }
  };
  const center = (page: ReturnType<typeof pdf.addPage>, text: string, y: number, size: number, font = bold, color = INK, cx = 306, maxW = 500) => {
    let s = size;
    while (font.widthOfTextAtSize(text, s) > maxW && s > 6) s -= 0.5;
    page.drawText(text, { x: cx - font.widthOfTextAtSize(text, s) / 2, y, size: s, font, color });
  };
  const name = restaurant?.name ?? "Menu";

  if (format === "tent") {
    // Letter page, two tents per page; fold along the dashed line of each half.
    for (let i = 0; i < tables.length; i += 2) {
      const page = pdf.addPage([612, 792]);
      for (let k = 0; k < 2 && i + k < tables.length; k++) {
        const t = tables[i + k];
        const top = 792 - k * 396;
        page.drawLine({ start: { x: 36, y: top - 396 }, end: { x: 576, y: top - 396 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7), dashArray: [4, 4] });
        center(page, name, top - 50, 20);
        center(page, "Scan for our menu  ·  Escanea para ver el menú", top - 74, 12, regular, RED);
        drawQr(page, qrImages[i + k], 306 - 115, top - 320, 230);
        center(page, t.label, top - 350, 16);
        center(page, "English · Español  ·  USD and more", top - 372, 9, regular);
      }
    }
  } else {
    // 12 stickers per Letter page (3 x 4), 2.4" squares.
    const size = 172.8;
    const gapX = (612 - 3 * size) / 4;
    const gapY = (792 - 4 * size) / 5;
    for (let i = 0; i < tables.length; i += 12) {
      const page = pdf.addPage([612, 792]);
      for (let k = 0; k < 12 && i + k < tables.length; k++) {
        const col = k % 3;
        const row = Math.floor(k / 3);
        const x = gapX + col * (size + gapX);
        const y = 792 - gapY - (row + 1) * size - row * gapY;
        page.drawRectangle({ x, y, width: size, height: size, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5, borderDashArray: [3, 3] });
        drawQr(page, qrImages[i + k], x + 26, y + 30, size - 52);
        center(page, tables[i + k].label, y + 14, 10, bold, INK, x + size / 2, size - 12);
        center(page, "Menu · Menú", y + size - 18, 9, regular, RED, x + size / 2, size - 12);
      }
    }
  }

  const bytes = await pdf.save();
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="qr-${format}s.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
