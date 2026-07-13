/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Mirrors nocmon: Prisma 7 driver-adapter stack kept external to the bundle.
  // REPRO_NO_EXTERNALS=1 at build time removes the layer for bisection.
  serverExternalPackages: process.env.REPRO_NO_EXTERNALS
    ? []
    : ['@prisma/client', '@prisma/adapter-pg', 'pg'],
};

export default nextConfig;
