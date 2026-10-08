import type { Metadata } from "next";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/standard-italic.css";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Architect 2.0",
  description: "Prototype to production in one project: build agentic apps, hand them to developers, ship them with approval.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
