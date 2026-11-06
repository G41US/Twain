import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import BottomNav from "./components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Twain",
  description: "Swipe, Match, Connect – The Future of Dating",
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
      <body className={`${inter.className} min-h-dvh bg-gray-50 pt-[env(safe-area-inset-top)] text-gray-900`}>
        <Providers>
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
