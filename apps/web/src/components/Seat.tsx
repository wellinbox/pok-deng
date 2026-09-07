import type { Card, PlayerPublic } from "@pokdeng/shared";
import { avatarUrl } from "@pokdeng/shared";
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

function stackChips(amount: number) {
  const vals = [100, 50, 25, 10, 5];
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
  const face =
    hole && hole.length
      ? hole
      : showCards && player?.revealedCards?.length
        ? player.revealedCards
        : undefined;
  const n = player ? Math.min(player.cardCount || face?.length || 0, 3) : 0;
  const showSideCards = !!(player && n > 0);
  const list = showSideCards
    ? face
      ? face.slice(0, n)
      : Array.from({ length: n })
    : [];
  const src = player ? player.avatar || avatarUrl(player.id) : "";
  const crown = player?.role === "DEALER";
  const rim = player?.role && player.role !== "DEALER" ? player.role : crown ? "DEALER" : undefined;
  const betChips = player && player.bet > 0 ? stackChips(player.bet) : [];
  const taemText = player?.pok
    ? `ป๊อก ${player.pok}`
    : player?.taem != null
      ? `${player.taem}`
      : "";
  const drawing = n >= 3 && !dealing;

  return (
    <div className={`seat-stack ${cls} ${player?.lastResult === "win" ? "is-winner" : ""} ${dealing ? "is-dealing" : ""}`}>
      <div className="play-pile">
        {showSideCards && (
          <div className={`seat-cards ${dealing ? "dealing" : ""} ${drawing ? "drawing" : ""}`}>
            {list.map((c, i) => (
              <PlayingCard
                key={typeof c === "object" && c ? c.id : `${i}-${n}`}
                card={typeof c === "object" && c ? c : undefined}
                i={i}
              />
            ))}
          </div>
        )}
        {taemText && showCards && <div className="seat-taem">{taemText}</div>}
        {betChips.length > 0 && (
          <div className="bet-stack" title={`${player!.bet}`}>
            <div className="bet-pile">
              {betChips.map((v, i) => (
                <i key={`${v}-${i}`} className={`chip c${v} betchip`} style={{ zIndex: i + 1, left: `${i * 7}px` }}>
                  {v}
                </i>
              ))}
            </div>
            <span className="bet-amt">{player!.bet}</span>
          </div>
        )}
      </div>
      <div className="seat-hud">
        {rim && <div className="rim-badge">{rim}</div>}
        <div className={`avatar ${crown ? "dealer" : ""}`}>
          {src ? <img src={src} alt="" /> : <Silhouette crown={crown} />}
        </div>
        <div className={`nameplate ${player ? "" : "empty"}`}>{player?.name || ""}</div>
        {player && <div className="seat-chips">{player.chips}</div>}
      </div>
    </div>
  );
}
