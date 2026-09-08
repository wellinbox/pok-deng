import type { Card } from "@pokdeng/shared";

const SUIT: Record<string, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };

export default function PlayingCard({ card, i = 0 }: { card?: Card | null; i?: number }) {
  if (!card) {
    return (
      <div className="flip-card is-back" style={{ animationDelay: `${i * 70}ms` }}>
        <div className="card back" />
      </div>
    );
  }
  const red = card.suit === "hearts" || card.suit === "diamonds";
  return (
    <div className="flip-card is-face" style={{ animationDelay: `${i * 70}ms` }}>
      <div className={`card ${red ? "red" : "black"}`}>
        <div className="rank">{card.rank}</div>
        <div className="suit">{SUIT[card.suit]}</div>
        <div className="suit-lg">{SUIT[card.suit]}</div>
      </div>
    </div>
  );
}
