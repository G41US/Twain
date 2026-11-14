"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Icon, { type IconName } from "./Icon";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/swipe", label: "Swipe", icon: "flame" },
  { href: "/matches", label: "Matches", icon: "chatbubbles" },
  { href: "/profile", label: "Profile", icon: "person-circle" },
];

export default function BottomNav() {
  const { status } = useSession();
  const path = usePathname();
  // Chat has its own header and input bar; admin is a separate console.
  if (status !== "authenticated" || path.startsWith("/chat") || path.startsWith("/admin")) return null;

  return (
    <>
      {/* spacer so page content never sits under the fixed bar */}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))]" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-white pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex h-16 max-w-md">
          {tabs.map((t) => {
            const active = path.startsWith(t.href);
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center text-xs ${active ? "font-semibold text-primary" : "text-gray-500"}`}
                >
                  <Icon name={active ? t.icon : (`${t.icon}-outline` as IconName)} className="mb-0.5 h-6 w-6" />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
