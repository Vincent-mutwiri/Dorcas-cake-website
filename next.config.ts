import type { NextConfig } from "next";

// Suppress development warnings
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  const originalWarn = console.warn;
  console.warn = function (message, ...args) {
    if (message && typeof message === 'string' && 
        (message.includes('preload') || message.includes('font'))) {
      return;
    }
    originalWarn.apply(console, [message, ...args]);
  };
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vincent-bucket2025.s3.eu-north-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Disable Turbopack for now due to font loading issues
    // @ts-ignore - Disabling Turbopack
    turbo: false
  },
};

export default nextConfig;
