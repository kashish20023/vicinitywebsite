import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Studio i | A Workspace for Every You",
  description:
    "Flexible desks, private cabins, meeting rooms and more — book inspiring coworking spaces instantly, anytime, anywhere at Studio i in Jaipur.",
  keywords: [
    "Studio i",
    "Coworking space Jaipur",
    "Horizon Tower coworking",
    "Lehariya KGK Realty",
    "Private cabin Jaipur",
    "Meeting rooms Jaipur",
  ],
  authors: [{ name: "Studio i Team" }],
  icons: {
    icon: "/assets/logo-studioi.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} scroll-smooth`}>
      <body className="font-sans antialiased bg-white text-gray-900 min-h-screen selection:bg-[#0e4962] selection:text-white">
        {children}
      </body>
    </html>
  );
}
