import type { Metadata, Viewport } from "next";
import { jakarta } from "./fonts";
import "./globals.css";
import { Providers } from "./providers";


export const metadata: Metadata = {
  title: "Twain",
  description: "Swipe, Match, Connect – The Future of Dating",
  manifest: "/site.webmanifest", // admin/layout.tsx swaps in the Twain Admin manifest
  appleWebApp: { capable: true, title: "Twain", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets us use env(safe-area-inset-*) to stay clear of the status bar / notch
  themeColor: "#FF0050",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} min-h-dvh bg-gray-50 pt-[env(safe-area-inset-top)] text-gray-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
