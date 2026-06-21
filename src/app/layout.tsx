import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Press_Start_2P,
  VT323,
  Black_Ops_One,
  Exo_2,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const pressStart2P = Press_Start_2P({ weight: "400", variable: "--font-pixel", subsets: ["latin"] });
const vt323 = VT323({ weight: "400", variable: "--font-vt", subsets: ["latin"] });
const blackOpsOne = Black_Ops_One({ weight: "400", variable: "--font-display", subsets: ["latin"] });
const exo2 = Exo_2({ variable: "--font-exo", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jb", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Foundry",
  description: "Full-stack platform for a modded Minecraft server",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} ${vt323.variable} ${blackOpsOne.variable} ${exo2.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
