import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // turbopack: {
  //   // root: "./src/app",
  //   enabled: false,
  // },
};

export default nextConfig;
