import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  // Use the installed TypeScript 5 compiler API for build-time checking.
  experimental: { useTypeScriptCli: false },
};
export default nextConfig;
