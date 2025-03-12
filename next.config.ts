import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Partial Prerendering(PPR)の実験的(experimental)な実装
  // incremental(増分) 値を使用すると、特定のルートに PPR を採用できます。
  experimental: {
    ppr: 'incremental'
  }
};

export default nextConfig;
