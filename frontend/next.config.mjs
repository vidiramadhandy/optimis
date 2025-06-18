/** @type {import('next').NextConfig} */
const nextConfig = {
  // Untuk reverse proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://optipredict.my.id/api/:path*',
      },
    ]
  },
  
  // Jika menggunakan static export
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
