import Link from "next/link";
import { Heart, Play, Users } from "lucide-react";
import type { GameSummary } from "@/lib/types";

export function GameCard({ game }: { game: GameSummary }) {
  return <article className="card game-card">
    <Link href={"/games/"+game.id}>
      {game.thumbnail_url ? <img className="game-cover" src={game.thumbnail_url} alt="" loading="lazy"/> :
        <div className="game-cover game-cover-fallback"><span>Vertex</span><strong>{game.title}</strong></div>}
      <div className="game-body">
        <h3 className="game-title">{game.title}</h3>
        <p className="meta">{game.genre} · {game.current_version}</p>
        <div className="stat-row">
          <span><Users size={13} style={{verticalAlign:"-2px"}}/> {game.visits_count.toLocaleString()} visits</span>
          <span><Heart size={13} style={{verticalAlign:"-2px"}}/> {game.likes_count.toLocaleString()}</span>
          <span><Play size={13} style={{verticalAlign:"-2px"}}/> {game.status}</span>
        </div>
      </div>
    </Link>
  </article>;
}
