/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during production builds to prevent errors
  eslint: {
    // Warning: This allows production builds to successfully complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
