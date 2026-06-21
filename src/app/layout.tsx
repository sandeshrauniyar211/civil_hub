import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CivilHub — Engineering tools for IOE students",
  description:
    "CivilHub is a precision engineering utility platform for IOE students in Nepal. Internal marks calculator, civil engineering calculators, surveying toolkit, and more.",
  keywords: [
    "CivilHub",
    "IOE",
    "Nepal",
    "Engineering",
    "Civil Engineering",
    "GPA Calculator",
    "Surveying",
    "Calculators",
  ],
  authors: [{ name: "CivilHub" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "CivilHub — Engineering tools for IOE students",
    description:
      "Precision engineering utilities for IOE students in Nepal. Built for the way engineers actually work.",
    siteName: "CivilHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivilHub — Engineering tools for IOE students",
    description:
      "Precision engineering utilities for IOE students in Nepal.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
