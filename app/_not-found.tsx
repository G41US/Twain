// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-2xl mt-4">Page not found</p>
      <Link href="/" className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg">
        Go Home
      </Link>
    </div>
  );
}
