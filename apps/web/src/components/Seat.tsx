import type { Card, PlayerPublic } from "@pokdeng/shared";
import PlayingCard from "./PlayingCard";

function Silhouette({ crown }: { crown?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none">
      {crown ? (
        <>
          <path d="M10 28 L18 18 L32 26 L46 18 L54 28 L50 38 H14 Z" fill="#e8c86a" stroke="#8a6414" />
          <circle cx="18" cy="18" r="3" fill="#fff4c8" />
          <circle cx="32" cy="16" r="3" fill="#fff4c8" />
          <circle cx="46" cy="18" r="3" fill="#fff4c8" />
        </>
      ) : (
        <>
          <circle cx="32" cy="22" r="13" fill="#050505" />
          <path d="M10 58c2-16 12-22 22-22s20 6 22 22" fill="#050505" />
        </>
      )}
    </svg>
  );
}

export default function SeatView({
  player,
  cls,
  showCards,
  hole,
  rim,
  crown,
}: {
  player?: PlayerPublic;
  cls: string;
  showCards?: boolean;
  hole?: Card[];
  rim?: string;
  crown?: boolean;
}) {
  const cards = player && showCards ? player.revealedCards : undefined;
  const mine = hole && hole.length ? hole : cards;
  const showSideCards = player && player.cardCount > 0 && cls !== "s0";
  return (
    <div className="grid justify-items-center gap-1">
      {showSideCards && (
        <div className="flex -space-x-2">
          {(mine ? mine.slice(0, 2) : Array.from({ length: Math.min(player.cardCount, 2) })).map((c, i) => (
            <PlayingCard key={typeof c === "object" && c ? c.id : i} card={showCards && typeof c === "object" ? c : undefined} i={i} />
          ))}
        </div>
      )}
      <div className={`flex items-center gap-1 ${cls === "s1" || cls === "s2" ? "flex-row-reverse" : ""}`}>
        {rim && <div className="rim-badge">{rim}</div>}
        <div className="avatar">
          <Silhouette crown={crown} />
        </div>
      </div>
      <div className={`nameplate ${player ? "" : "text-transparent"}`}>{player?.name || "."}</div>
      {player && <div className="text-[10px] text-amber-200/80">{player.chips}</div>}
    </div>
  );
}
