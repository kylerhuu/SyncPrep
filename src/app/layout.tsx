import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncPrep — Meeting prep & scheduling",
  description:
    "Timezone-aware scheduling and AI-powered meeting preparation for students and professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans text-base">
        {children}
      </body>
    </html>
  );
}
