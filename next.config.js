/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // The app's update check: always the manifest attached to the newest GitHub release (published by CI).
  // The Twain app itself (mobile/, built for the web by `npm run build:web-app`) lives at /app.
  // Old web-only pages now point into it.
  // Single-page app: any /app/... path that isn't a real file loads the app shell, which routes itself.
  async rewrites() {
    return {
      fallback: [
        { source: '/app', destination: '/app/index.html' },
        { source: '/app/:path*', destination: '/app/index.html' },
      ],
    };
  },
  async redirects() {
    return [
      { source: '/', destination: '/app', permanent: false },
      { source: '/swipe', destination: '/app/discover', permanent: false },
      { source: '/matches', destination: '/app/matches', permanent: false },
      { source: '/profile', destination: '/app/profile', permanent: false },
      { source: '/chat/:id', destination: '/app/chat/:id', permanent: false },
      {
        source: '/app-version.json',
        destination: 'https://github.com/G41US/Twain/releases/latest/download/app-version.json',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
