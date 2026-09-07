import { useEffect, useState } from "react";
import type { Card } from "@pokdeng/shared";

const SUIT: Record<string, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };

export default function PlayingCard({ card, i = 0 }: { card?: Card | null; i?: number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!card) {
      setOpen(false);
      return;
    }
    setOpen(false);
    const t = window.setTimeout(() => setOpen(true), 40 + i * 90);
    return () => window.clearTimeout(t);
  }, [card?.id, i]);

  const red = card && (card.suit === "hearts" || card.suit === "diamonds");

  return (
    <div className={`flip-card ${open && card ? "is-open" : ""}`}>
      <div className="flip-inner">
        <div className="card back face back-face" />
        <div className={`card face front-face ${red ? "red" : "black"}`}>
          {card && (
            <>
              <div className="rank">{card.rank}</div>
              <div className="suit">{SUIT[card.suit]}</div>
              <div className="suit-lg">{SUIT[card.suit]}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
