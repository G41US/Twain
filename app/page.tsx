import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold mb-8">Welcome back, {session.user?.name}!</h1>
        <div className="space-x-4">
          <Link href="/profile" className="bg-blue-600 text-white px-6 py-3 rounded-lg">Profile</Link>
          <Link href="/swipe" className="bg-pink-600 text-white px-6 py-3 rounded-lg">Swipe</Link>
          <Link href="/matches" className="bg-green-600 text-white px-6 py-3 rounded-lg">Matches</Link>
          {session.user.isAdmin && <Link href="/admin" className="bg-red-600 text-white px-6 py-3 rounded-lg">Admin</Link>}
          <button onClick={() => signOut()} className="bg-gray-600 text-white px-6 py-3 rounded-lg">Sign Out</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Find Your Match in 2026</h1>
      <button onClick={() => signIn("google")} className="bg-red-600 text-white px-8 py-4 rounded-full text-xl">
        Sign in with Google
      </button>
    </div>
  );
}
