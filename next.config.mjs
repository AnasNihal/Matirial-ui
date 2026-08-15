/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:"scontent.cdninstagram.com"
      },
       {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
    ],
    // 🚀 FAST: Optimize images for faster loading
    formats: ['image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache
  },
  
  // 🚀 FAST: Compress responses
  compress: true,
  
  // 🚀 FAST: Optimize production builds
  productionBrowserSourceMaps: false,
  
  // 🚀 FAST: Enable SWC minification (faster)
  swcMinify: true,
  
  // 🚀 FAST: Optimize fonts
  optimizeFonts: true,
  
  // 🚀 FAST: Modularize imports (smaller bundles)
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  
  // 🚀 FAST: Experimental features for speed
  experimental: {
    optimizePackageImports: ['@tanstack/react-query', 'sonner'],
    webVitalsAttribution: ['CLS', 'LCP'],
  },
}

export default nextConfig
