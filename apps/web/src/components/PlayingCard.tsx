import { motion } from "framer-motion";
import type { Card } from "@pokdeng/shared";

const SUIT: Record<string, string> = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" };

export default function PlayingCard({ card, i = 0 }: { card?: Card | null; i?: number }) {
  if (!card) {
    return (
      <motion.div
        className="card back"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: i * 0.08 }}
      />
    );
  }
  const red = card.suit === "hearts" || card.suit === "diamonds";
  return (
    <motion.div
      className={`card ${red ? "red" : "black"}`}
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ delay: i * 0.08 }}
    >
      <div className="rank">{card.rank}</div>
      <div className="suit">{SUIT[card.suit]}</div>
      <div className="suit-lg">{SUIT[card.suit]}</div>
    </motion.div>
  );
}
