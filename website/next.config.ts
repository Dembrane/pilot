import { NextConfig } from 'next';

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

  // !! WARN !!
  // Dangerously allow production builds to successfully complete even if
  // your project has type errors.
  // !! WARN !!
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config, { isServer }) => {
    // Add loader for .po files
    config.module.rules.push({
      test: /\.po$/,
      use: ['@lingui/loader'],
    });

    return config;
  },

  // Other configurations
  async rewrites() {
    return [
      {
        source: '/notion/:path*',
        destination: '/notion/:path*',
      },
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
      {
        hostname: '*.amazonaws.com',
      },
      {
        hostname: '*.s3.amazonaws.com',
      },
      {
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
      {
        hostname: 'res.cloudinary.com',
      },
      {
        hostname: 'media.discordapp.net',
      },
      {
        hostname: 'www.notion.so',
      },
      {
        hostname: 'images.openai.com',
      },
      {
        hostname: 'images.unsplash.com',
      },
      {
        hostname: 'files.oaiusercontent.com',
      },
      {
        hostname: 'www.dembrane.com',
      },
    ],
  },

  // Add redirects configuration
  async redirects() {
    return [
      {
        source: '/blog/brainwave-eindhoven-2-24-nl',
        destination:
          'https://dembrane.notion.site/BrainWaves-Een-test-van-onze-oplossing-voor-hybride-participatie-a0804b5cc479483f95aa0b96f26252dd?pvs=4',
        permanent: true,
      },
      {
        source: '/top-level-pages/final-report-democratic-inputs-to-ai',
        destination: '/blog/report-openai-october-2023',
        permanent: true,
      },
      {
        source: '/top-level-pages/contact-us',
        destination: 'https://forms.dembrane.com/contact',
        permanent: true,
      },
    ];
  },

  // Add reactStrictMode
  reactStrictMode: true,
};

export default nextConfig;
