import type { Card } from "@pokdeng/shared";

export default function PlayingCard({ card, i = 0 }: { card?: Card | null; i?: number }) {
  if (!card) {
    return <div className="flip-card is-back" style={{ animationDelay: `${i * 70}ms` }}><div className="card-graphic back" /></div>;
  }
  return (
    <div className="flip-card is-face" style={{ animationDelay: `${i * 70}ms` }}>
      <div 
        className="card-graphic" 
        data-suit={card.suit} 
        data-rank={card.rank}
      />
    </div>
  );
}
