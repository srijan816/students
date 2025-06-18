import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Debate Achievements Tracker",
  description: "Track and view debate tournament achievements and leaderboard rankings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
