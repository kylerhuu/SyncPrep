import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SyncPrep — Meeting prep & scheduling",
  description:
    "Timezone-aware scheduling and AI-powered meeting preparation for students and professionals.",
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans text-base">
        {children}
      </body>
    </html>
  );
}
