import type { Card, PlayerPublic } from "@pokdeng/shared";
import PlayingCard from "./PlayingCard";

function Silhouette() {
  return (
    <svg viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="22" r="12" fill="#111" stroke="#c9a227" strokeWidth="1.5" />
      <path d="M12 56c2-14 12-20 20-20s18 6 20 20" fill="#111" stroke="#c9a227" strokeWidth="1.5" />
    </svg>
  );
}

export default function SeatView({
  player,
  cls,
  showCards,
  hole,
}: {
  player?: PlayerPublic;
  cls: string;
  showCards?: boolean;
  hole?: Card[];
}) {
  if (!player) {
    return (
      <div className={`seat ${cls}`}>
        <div className="avatar"><Silhouette /></div>
        <div className="nameplate">ว่าง</div>
      </div>
    );
  }
  const cards = showCards ? player.revealedCards : undefined;
  const mine = hole && hole.length ? hole : cards;
  return (
    <div className={`seat ${cls}`}>
      <div className="hand-row">
        {player.cardCount > 0 &&
          (mine
            ? mine.map((c, i) => <PlayingCard key={c.id} card={c} i={i} />)
            : Array.from({ length: player.cardCount }).map((_, i) => <PlayingCard key={i} i={i} />))}
      </div>
      <div className="avatar">
        <Silhouette />
        {player.role && <span className="role-badge">{player.role}</span>}
      </div>
      <div className="nameplate">{player.name}</div>
      <div className="chips-mini">{player.chips} · ลง {player.bet}</div>
      {player.pok && <div className="result-tag">ป๊อก {player.pok}</div>}
      {!player.pok && player.dengLabel && <div className="result-tag">{player.dengLabel}</div>}
      {player.lastResult === "win" && <div className="result-tag">WIN</div>}
    </div>
  );
}
