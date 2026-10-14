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
  title: "ArchiCue",
  description:
    "ArchiCue turns your site notes and client brief into a pre-design brief for Philippine projects. Every requirement links to the exact NBCP or Fire Code section and page, so you can check it yourself.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <div
          role="note"
          className="sticky top-0 z-10 bg-foreground px-4 py-2 text-center text-sm font-medium text-background"
        >
          Research aid only, not a compliance check. Verify every requirement with a licensed architect and
          your LGU.
        </div>
        {children}
      </body>
    </html>
  );
}
