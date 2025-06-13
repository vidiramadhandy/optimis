/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Konfigurasi tambahan untuk Azure Static Web Apps
  assetPrefix: '',
  basePath: ''
};

module.exports = nextConfig;
