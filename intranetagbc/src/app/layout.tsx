import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { Toaster } from "react-hot-toast";
import "@/styles/globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Intranet AGBC — Plataforma Interna de Gestión",
  description: "Sistema integral de gestión documental, correspondencia, trámites y recursos humanos para AGBC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${outfit.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={10}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: "600",
                padding: "14px 20px",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
              },
              success: {
                style: {
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  border: "1px solid rgba(16,185,129,0.3)",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#10b981",
                },
              },
              error: {
                style: {
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  border: "1px solid rgba(239,68,68,0.3)",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#ef4444",
                },
              },
            }}
          />
          {children}
          <FullscreenToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
