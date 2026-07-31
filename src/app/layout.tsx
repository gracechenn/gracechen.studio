import type { Metadata } from "next";
import "./globals.css";
import { bethEllen, texGyreHeros } from "@/lib/fonts";
import { CartProvider } from "@/context/CartContext";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gracechen.studio";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Grace Chen",
    template: "%s — Grace Chen",
  },
  description:
    "Grace Chen is a painter and artist based in nyc. Paintings, drawings, textiles, and prints.",
  openGraph: {
    title: "Grace Chen",
    description:
      "Grace Chen is a painter and artist based in nyc. Paintings, drawings, textiles, and prints.",
    url: siteUrl,
    siteName: "Grace Chen",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grace Chen",
    description: "Grace Chen is a painter and artist based in nyc.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bethEllen.variable} ${texGyreHeros.variable} h-full`}>
      <body className="min-h-full">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
