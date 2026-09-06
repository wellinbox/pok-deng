import {
  Card,
  HandEval,
  RANKS,
  Rank,
  SUITS,
  Suit,
} from "./types.js";

export function cardId(suit: Suit, rank: Rank): string {
  return `${rank}_${suit}`;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: cardId(suit, rank) });
    }
  }
  return deck;
}

export function shuffle(deck: Card[], rng = Math.random): Card[] {
  const a = deck.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rankValue(rank: Rank): number {
  if (rank === "A") return 1;
  if (rank === "10" || rank === "J" || rank === "Q" || rank === "K") return 0;
  return Number(rank);
}

export function calculateTaem(cards: Card[]): number {
  const sum = cards.reduce((s, c) => s + rankValue(c.rank), 0);
  return sum % 10;
}

export function detectPok(cards: Card[]): 8 | 9 | null {
  if (cards.length !== 2) return null;
  const t = calculateTaem(cards);
  if (t === 8 || t === 9) return t;
  return null;
}

const FACE = new Set<Rank>(["J", "Q", "K"]);

function sameSuit(cards: Card[]): boolean {
  return cards.length > 0 && cards.every((c) => c.suit === cards[0].suit);
}

function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank;
}

function isTong(cards: Card[]): boolean {
  return cards.length === 3 && cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
}

function isThreeFace(cards: Card[]): boolean {
  return cards.length === 3 && cards.every((c) => FACE.has(c.rank));
}

function rankOrder(rank: Rank): number {
  if (rank === "A") return 1;
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
  return Number(rank);
}

function isStraight(cards: Card[]): boolean {
  if (cards.length !== 3) return false;
  const vals = cards.map((c) => rankOrder(c.rank)).sort((a, b) => a - b);
  if (vals[0] === 1 && vals[1] === 2 && vals[2] === 3) return true;
  return vals[1] === vals[0] + 1 && vals[2] === vals[1] + 1;
}

export function detectDeng(cards: Card[]): { deng: number; label: string } {
  if (cards.length < 2) return { deng: 1, label: "" };
  if (cards.length === 2) {
    if (isPair(cards)) return { deng: 2, label: "2 เด้ง (คู่)" };
    if (sameSuit(cards)) return { deng: 2, label: "2 เด้ง" };
    return { deng: 1, label: "" };
  }
  if (isTong(cards)) return { deng: 5, label: "ตอง" };
  if (isStraight(cards) && sameSuit(cards)) return { deng: 5, label: "สเตรทฟลัช" };
  if (isThreeFace(cards)) return { deng: 3, label: "สามเหลือง" };
  if (isStraight(cards)) return { deng: 3, label: "เรียง" };
  if (sameSuit(cards)) return { deng: 3, label: "3 เด้ง" };
  return { deng: 1, label: "" };
}

export function evaluateHand(cards: Card[]): HandEval {
  const taem = calculateTaem(cards);
  const pok = detectPok(cards);
  const { deng, label } = detectDeng(cards);
  return { taem, pok, deng, dengLabel: label };
}

export function compareHands(player: Card[], dealer: Card[]): number {
  const p = evaluateHand(player);
  const d = evaluateHand(dealer);
  if (p.pok && d.pok) {
    if (p.pok === d.pok) return 0;
    return p.pok > d.pok ? 1 : -1;
  }
  if (p.pok && !d.pok) return 1;
  if (!p.pok && d.pok) return -1;
  if (p.taem === d.taem) return 0;
  return p.taem > d.taem ? 1 : -1;
}

export interface PayoutResult {
  playerDelta: number;
  dealerDelta: number;
  multiplier: number;
  outcome: "win" | "lose" | "draw";
}

export function payout(playerCards: Card[], dealerCards: Card[], bet: number): PayoutResult {
  if (bet <= 0) {
    return { playerDelta: 0, dealerDelta: 0, multiplier: 0, outcome: "draw" };
  }
  const cmp = compareHands(playerCards, dealerCards);
  if (cmp === 0) {
    return { playerDelta: 0, dealerDelta: 0, multiplier: 0, outcome: "draw" };
  }
  const winnerCards = cmp > 0 ? playerCards : dealerCards;
  const winDeng = Math.max(1, detectDeng(winnerCards).deng);
  const multiplier = Math.max(1, winDeng);
  const amount = bet * multiplier;
  if (cmp > 0) {
    return { playerDelta: amount, dealerDelta: -amount, multiplier, outcome: "win" };
  }
  return { playerDelta: -amount, dealerDelta: amount, multiplier, outcome: "lose" };
}

export function shouldAutoHit(cards: Card[], forceLowHit: boolean): boolean {
  if (cards.length !== 2) return false;
  if (detectPok(cards)) return false;
  const t = calculateTaem(cards);
  if (forceLowHit && t <= 3) return true;
  return false;
}

export function dealerShouldHit(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  if (detectPok(cards)) return false;
  return calculateTaem(cards) <= 4;
}
