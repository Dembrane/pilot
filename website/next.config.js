/** @type {import('next').NextConfig} */
const nextConfig = {
  // Core configuration
  serverExternalPackages: ['@lingui/loader'],
  staticPageGenerationTimeout: 500,

  // Webpack configuration (for non-Turbopack environments)
  webpack: (config) => {
    config.module.rules.push({
      test: /\.po$/,
      use: {
        loader: '@lingui/loader',
      },
    });
    return config;
  },

  // Turbopack configuration
  experimental: {
    turbo: {
      rules: {
        '*.po': {
          loaders: ['@lingui/loader'],
          as: '*.js',
        },
      },
      resolveExtensions: ['.po', '.tsx', '.ts', '.jsx', '.js', '.json'],
      moduleIdStrategy: 'named', // Use 'named' for development
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

module.exports = nextConfig;
