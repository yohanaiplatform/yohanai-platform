import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yohanai.id"),

  title: {
    default: "Yohan.AI",
    template: "%s | Yohan.AI",
  },

  description:
    "Yohan.AI adalah Property Buyer Behavior Intelligence System untuk membantu agen properti mengelola lead, CRM, AI Intelligence, dan WhatsApp Automation.",

  keywords: [
    "Yohan AI",
    "CRM Properti",
    "AI Property",
    "Real Estate CRM",
    "WhatsApp Automation",
    "Property Intelligence",
    "Indonesia Property",
  ],

  applicationName: "Yohan.AI",

  authors: [
    {
      name: "Yohan.AI",
    },
  ],

  creator: "Yohan.AI",

  publisher: "Yohan.AI",

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/images/logo/favicon.png",
    shortcut: "/images/logo/favicon.png",
    apple: "/images/logo/apple-touch-icon.png",
  },

  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://yohanai.id",
    siteName: "Yohan.AI",
    title: "Yohan.AI",
    description:
      "Property Buyer Behavior Intelligence System untuk agen properti Indonesia.",
    images: [
      {
        url: "/images/og/og-image.png",
        width: 1200,
        height: 630,
        alt: "Yohan.AI",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Yohan.AI",
    description:
      "Property Buyer Behavior Intelligence System untuk agen properti Indonesia.",
    images: ["/images/og/og-image.png"],
  },
  
  other: {
    "facebook-domain-verification": "83t9ydmak9gh82i24f1wc3ijvfuo24",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}