import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garage Log",
  description: "Realtime car build task board. Track every mod, every milestone, every wrench turn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
