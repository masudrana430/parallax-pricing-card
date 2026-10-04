import type { Metadata } from "next";
import "@fontsource/noto-sans-bengali/bengali-400.css";
import "@fontsource/noto-sans-bengali/bengali-600.css";
import "@fontsource/noto-sans-devanagari/devanagari-400.css";
import "@fontsource/noto-sans-devanagari/devanagari-600.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Astra · Your Mission Health Companion",
  description:
    "A personal astronaut health monitoring workspace with multilingual symptom reporting. Research prototype.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
