import { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Core configuration
  // serverExternalPackages: ['@lingui/loader'],
  staticPageGenerationTimeout: 500,

  // Turbopack configuration
  experimental: {
    swcPlugins: [['@lingui/swc-plugin', {}]],
    turbo: {
      rules: {
        '*.po': {
          loaders: ['@lingui/loader'],
          as: '*.js',
        },
      },
      // resolveExtensions: ['.po', '.tsx', '.ts', '.jsx', '.js', '.json'],
      // moduleIdStrategy: 'named', // Use 'named' for development
    },
  },

  // Other configurations
  async rewrites() {
    return [
      {
        source: '/:lang/:slug*',
        destination: '/:lang/:slug*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(?!.*image/.*)',
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin-dembrane.azurewebsites.net',
        port: '',
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;
