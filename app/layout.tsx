import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: { default: "Vertex", template: "%s · Vertex" },
  description: "Play, create, publish, and discover original worlds on Vertex.",
  openGraph: { title: "Vertex", description: "A modern home for user-created games.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><SiteShell>{children}</SiteShell></body></html>;
}
