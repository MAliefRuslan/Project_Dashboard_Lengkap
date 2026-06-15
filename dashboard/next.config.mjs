/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Optional: Add basePath if deploying to a subfolder, e.g., basePath: '/Project_Dashboard_Lengkap',
  // But for simple GH Pages user sites or custom domains, we'll keep it simple or use basePath depending on repo name.
  // We'll set basePath to the repo name so assets load correctly on GitHub Pages
  basePath: '/Project_Dashboard_Lengkap',
  // Also disable image optimization as it's not supported in static exports
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
