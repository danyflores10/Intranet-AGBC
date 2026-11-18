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
      {
        // Reescribe archivos de comunicados para evitar errores 404 en producción PM2
        source: "/image/comunicados/:file*",
        destination: "/api/comunicados-archivos/:file*",
      },
    ]
  },
};

export default nextConfig;
