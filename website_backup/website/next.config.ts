import {withSentryConfig} from '@sentry/nextjs';
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

export default withSentryConfig(nextConfig, {
// For all available options, see:
// https://github.com/getsentry/sentry-webpack-plugin#options

org: "dembrane",
project: "dembrane-com",

// Only print logs for uploading source maps in CI
silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Upload a larger set of source maps for prettier stack traces (increases build time)
widenClientFileUpload: true,

// Automatically annotate React components to show their full name in breadcrumbs and session replay
reactComponentAnnotation: {
enabled: true,
},

// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
tunnelRoute: "/monitoring",

// Hides source maps from generated client bundles
hideSourceMaps: true,

// Automatically tree-shake Sentry logger statements to reduce bundle size
disableLogger: true,

// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
automaticVercelMonitors: true,
});