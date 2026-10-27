import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    localPatterns: [
      {
        pathname: "/**",
        search: "",
      },
      {
        pathname: "/**",
        search: "?*",
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Reescribe cualquier archivo estático en /documentos/archivo.ext hacia el endpoint de streaming /api/documentos/archivo.ext
        source: "/documentos/:file([^/]+\\.[a-zA-Z0-9]{2,8})",
        destination: "/api/documentos/:file",
      },
    ]
  },
};

export default nextConfig;
