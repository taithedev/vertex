"use client";

import Link from "next/link";
import { Gamepad2, Search, Sparkles, UserRound, WandSparkles } from "lucide-react";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="shell">
    <header className="app-nav">
      <Link href="/" className="brand" aria-label="Vertex home">
        <span className="brand-mark"><Sparkles size={18}/></span><span>Vertex</span>
      </Link>
      <nav className="nav-links" aria-label="Primary">
        <Link className="nav-link" href="/">Home</Link>
        <Link className="nav-link" href="/discover">Discover</Link>
        <Link className="nav-link" href="/marketplace">Marketplace</Link>
        <Link className="nav-link" href="/messages">Messages</Link>
        <Link className="nav-link" href="/studio">Studio</Link>
      </nav>
      <div className="nav-actions">
        <Link className="btn sm ghost" href="/search" aria-label="Search Vertex"><Search size={16}/></Link>
        <Link className="btn sm" href="/create"><WandSparkles size={16}/>Create</Link>
        <Link className="btn sm primary" href="/login"><UserRound size={16}/>Sign in</Link>
      </div>
    </header>
    {children}
  </div>;
}
