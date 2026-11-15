import localFont from "next/font/local";

// Twain's typeface, bundled with the site so builds never depend on downloading fonts.
export const jakarta = localFont({
  src: [
    { path: "./fonts/PlusJakartaSans_400Regular.ttf", weight: "400" },
    { path: "./fonts/PlusJakartaSans_500Medium.ttf", weight: "500" },
    { path: "./fonts/PlusJakartaSans_600SemiBold.ttf", weight: "600" },
    { path: "./fonts/PlusJakartaSans_700Bold.ttf", weight: "700" },
    { path: "./fonts/PlusJakartaSans_800ExtraBold.ttf", weight: "800" },
  ],
  display: "swap",
});
