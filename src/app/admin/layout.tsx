import "../globals.css";
import type { Metadata, Viewport } from "next";
import { bodoni, figtree } from "../fonts";
import { ToastProvider } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: { default: "Menu admin", template: "%s · Menu admin" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#b8262b" };
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${figtree.variable}`}>
      <body className="min-h-dvh bg-cream">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
