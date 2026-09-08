import type { Card, PlayerPublic } from "@pokdeng/shared";
import { avatarUrl } from "@pokdeng/shared";
import PlayingCard from "./PlayingCard";
import { money } from "../lib/money";

function stackChips(amount: number) {
  const vals = [5000, 1000, 500, 100, 50, 25, 10, 5];
  const out: number[] = [];
  let left = Math.max(0, Math.floor(amount));
  for (const v of vals) {
    while (left >= v && out.length < 6) {
      out.push(v);
      left -= v;
    }
  }
  return out;
}

export default function SeatView({
  player,
  cls,
  showCards,
  hole,
  dealing,
}: {
  player?: PlayerPublic;
  cls: string;
  showCards?: boolean;
  hole?: Card[];
  dealing?: boolean;
}) {
  if (!player) return null;
  const face =
    hole && hole.length
      ? hole
      : showCards && player.revealedCards?.length
        ? player.revealedCards
        : undefined;
  const n = Math.min(player.cardCount || face?.length || 0, 3);
  const showSideCards = n > 0;
  const list = showSideCards
    ? face
      ? face.slice(0, n)
      : Array.from({ length: n })
    : [];
  const src = player.avatar || avatarUrl(player.id);
  const crown = player.role === "DEALER";
  const rim = player.role && player.role !== "DEALER" ? player.role : crown ? "DEALER" : undefined;
  const betChips = player.bet > 0 ? stackChips(player.bet) : [];
  const taemText = player.pok
    ? `ป๊อก ${player.pok}`
    : player.taem != null
      ? `${player.taem}`
      : "";
  const drawing = n >= 3 && !dealing;

  return (
    <div className={`seat-stack ${cls} ${player.lastResult === "win" ? "is-winner" : ""} ${dealing ? "is-dealing" : ""}`}>
      <div className="play-pile">
        {showSideCards && (
          <div className={`seat-cards ${dealing ? "dealing" : ""} ${drawing ? "drawing" : ""}`}>
            {list.map((c, i) => {
              const card = typeof c === "object" && c !== null && "id" in c ? c as Card : undefined;
              return (
                <PlayingCard
                  key={card?.id || `${i}-${n}`}
                  card={card}
                  i={i}
                />
              );
            })}
          </div>
        )}
        {taemText && showCards && <div className="seat-taem">{taemText}</div>}
        {betChips.length > 0 && (
          <div className="bet-stack" title={money(player.bet)}>
            <div className="bet-pile">
              {betChips.map((v, i) => (
                <i key={`${v}-${i}`} className={`chip c${v} betchip`} style={{ zIndex: i + 1, left: `${i * 7}px` }}>
                  {v}
                </i>
              ))}
            </div>
            <span className="bet-amt">{money(player.bet)}</span>
          </div>
        )}
      </div>
      <div className="seat-hud">
        {rim && <div className="rim-badge">{rim}</div>}
        <div className={`avatar ${crown ? "dealer" : ""}`}>
          <img src={src} alt="" />
        </div>
        <div className="nameplate">{player.name}</div>
        <div className="seat-chips">{money(player.chips)}</div>
      </div>
    </div>
  );
}
