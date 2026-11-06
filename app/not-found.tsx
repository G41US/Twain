import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-pink-100 to-purple-100">
      <h1 className="text-6xl font-bold text-purple-800">404</h1>
      <p className="text-2xl mt-4 text-gray-700">Page not found</p>
      <Link href="/" className="mt-8 px-8 py-4 bg-purple-600 text-white rounded-full text-lg hover:bg-purple-700 transition">
        Go Home
      </Link>
    </div>
  );
}
