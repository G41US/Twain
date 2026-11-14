import type { Metadata, Viewport } from "next";

// Lets "Add to Home screen" install the dashboard as its own app (separate from Twain itself).
export const metadata: Metadata = {
  title: "Twain Admin",
  manifest: "/admin.webmanifest",
  icons: { apple: "/admin-apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Twain Admin", statusBarStyle: "black" },
};

export const viewport: Viewport = { themeColor: "#140A18" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
