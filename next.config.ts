import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'http://shiftos-alb-91423707.eu-central-1.elb.amazonaws.com/:path*',
      },
    ];
  },
};

export default nextConfig;
