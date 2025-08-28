import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Web3Onboard from "@/components/Web3Onboard/Web3Onboard";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kaia - Rock Paper Scissors",
  description: "Kaia - Rock Paper Scissors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Web3Onboard>
          {children}
          <Toaster />
        </Web3Onboard>
      </body>
    </html>
  );
}
