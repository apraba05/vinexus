/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // xterm.js doesn't play well with strict mode double-mount
  transpilePackages: ["@xterm/xterm", "@xterm/addon-fit"],
};

module.exports = nextConfig;
