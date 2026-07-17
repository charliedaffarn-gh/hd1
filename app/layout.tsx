import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Dashboard",
  description: "Kitchen dashboard for calendar, email, and family tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
