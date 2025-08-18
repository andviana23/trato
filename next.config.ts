/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', '@radix-ui/react-icons', 'react-icons', 'lucide-react'],
  },
  webpack: (config, { isServer, dev }) => {
    // Bundle analyzer apenas em produção
    if (!isServer && !dev) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analysis.html',
        })
      );
    }

    // Otimizações para tree-shaking
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };

    // Ignorar módulos do servidor no frontend
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        worker_threads: false,
        dns: false,
      };
    }

    return config;
  },
}

export default nextConfig
