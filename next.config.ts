import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // This is to allow the Next.js dev server to accept requests from the
    // secure preview environment.
    allowedDevOrigins: [
      'https://*.cluster-zumahodzirciuujpqvsniawo3o.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
