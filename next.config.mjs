/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Repo ini adalah root project; abaikan lockfile lain di parent dir.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
