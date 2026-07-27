import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
 images: {
    dangerouslyAllowLocalIP: true, // dev only: backend runs on localhost
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/public/**",
      },
    ],
  },
};

export default nextConfig;