import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Fair Stay",
  description: "The next-generation multi-sided marketplace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${poppins.className} h-full antialiased`}
    >
      <body className={`${poppins.className} min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
