import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Starcast - Premium Diecast Collectibles",
  description: "Exclusive pre-order platform for rare 1:64 diecast cars",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
