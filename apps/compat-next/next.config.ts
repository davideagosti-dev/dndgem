import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dndgem/react', '@dndgem/dom', '@dndgem/core'],
  outputFileTracingRoot: monorepoRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
