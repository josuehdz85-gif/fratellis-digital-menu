import type { MetadataRoute } from "next";
import { publicStore } from "@/lib/store";

export const revalidate = 3600;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = "Menu";
  let color = "#b8262b";
  try {
    const r = await publicStore().get("restaurant", 1);
    if (r) {
      name = r.name;
      color = r.brand_primary;
    }
  } catch {
    /* defaults */
  }
  return {
    name: `${name} · Menu`,
    short_name: name.replace(/ (Italian )?Restaurant$/i, ""),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf6ee",
    theme_color: color,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
