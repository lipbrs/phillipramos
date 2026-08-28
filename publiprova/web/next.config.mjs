/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O print dos insights sobe junto com o formulário do creator (limite de 6 MB no app).
  experimental: { serverActions: { bodySizeLimit: '8mb' } },
};
export default nextConfig;
