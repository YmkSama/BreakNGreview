/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // YouTube embeds need to see where they are embedded from
        source: '/:path*',
        headers: [{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }],
      },
    ];
  },
};

export default nextConfig;
