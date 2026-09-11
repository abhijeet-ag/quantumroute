/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Don't fail production builds on ESLint style rules (e.g. prefer-const).
    // Compile and TypeScript type errors still fail the build correctly.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
