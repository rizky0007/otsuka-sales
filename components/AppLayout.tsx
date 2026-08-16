import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Otsuka Sales Manager",
  description: "Otsuka Sales Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}