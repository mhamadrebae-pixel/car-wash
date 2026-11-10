/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.1.60',
    '192.168.1.*',
    '192.168.*.*',
    '10.*.*.*',
    '*.devtunnels.ms',
    '*.euw.devtunnels.ms',
    '**.devtunnels.ms',
    '*.ngrok-free.app',
    '*.trycloudflare.com',
  ],
};

export default nextConfig;

