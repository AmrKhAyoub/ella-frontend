/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["172.20.10.2", "172.20.10.3", "172.20.10.6"],
  trailingSlash: true,
  output: 'export',
  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        // Adding the trailing slash directly to the proxy destination 
        // guarantees Django always receives it, preventing 500 redirects!
        source: '/api/chats/:path*',
        destination: 'http://127.0.0.1:8000/api/chats/:path*/', 
      },
    ];
  },
};

export default nextConfig;