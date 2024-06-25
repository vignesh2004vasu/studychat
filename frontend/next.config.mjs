/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

// next.config.js

const withTM = require('next-transpile-modules')(['react-toastify']);

module.exports = withTM({
  future: {
    webpack5: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    return config;
  },
});
