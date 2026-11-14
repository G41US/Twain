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
  async redirects() {
    return [
      {
        source: '/app-version.json',
        destination: 'https://github.com/G41US/Twain/releases/latest/download/app-version.json',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
