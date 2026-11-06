import type { MetadataRoute } from "next";

// shortcut: no service worker, so no offline mode; Chrome/Android still offers "Install app" without one.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Twain",
    short_name: "Twain",
    description: "Swipe, Match, Connect",
    start_url: "/swipe",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#FF0050",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
