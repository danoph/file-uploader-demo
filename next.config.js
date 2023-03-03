/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1m5oohnuppcs9.cloudfront.net',
      },
    ],
  },
}

module.exports = nextConfig
