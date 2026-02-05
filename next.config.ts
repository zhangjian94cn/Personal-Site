import type { NextConfig } from "next";
import { withContentlayer } from "next-contentlayer2";

const nextConfig: NextConfig = {
  // Enable MDX pages
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  
  // Enable static export for GitHub Pages
  // Uncomment when deploying to GitHub Pages:
  output: 'export',
  
  // Image optimization (disable for static export)
  images: {
    unoptimized: true, // Set to true for static export
  },
  
  // Empty turbopack config to silence webpack warning
  // Contentlayer uses webpack, so this allows the build to proceed
  turbopack: {},
  
  // Webpack configuration for YAML loader
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: 'yaml-loader',
    });
    return config;
  },
};

export default withContentlayer(nextConfig);
