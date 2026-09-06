export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type Phase =
  | "waiting"
  | "betting"
  | "dealing"
  | "playerAction"
  | "dealerAction"
  | "reveal"
  | "payout"
  | "nextRound";

export type SeatRole = "DEALER" | "SB" | "BB" | "LB" | null;

export interface PlayerPublic {
  id: string;
  name: string;
  chips: number;
  bet: number;
  seat: number;
  ready: boolean;
  folded: boolean;
  connected: boolean;
  role: SeatRole;
  cardCount: number;
  revealedCards?: Card[];
  taem?: number;
  pok?: 8 | 9 | null;
  deng?: number;
  dengLabel?: string;
  lastResult?: "win" | "lose" | "draw" | null;
}

export interface PlayerPrivate extends PlayerPublic {
  cards: Card[];
}

export interface RoomState {
  roomId: string;
  hostId: string;
  dealerId: string;
  phase: Phase;
  players: PlayerPublic[];
  pot: number;
  minBet: number;
  maxBet: number;
  timerEndsAt: number | null;
  currentActorId: string | null;
  publicMessage: string;
  chat: ChatMessage[];
  lastHistory: string[];
  solo: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  text: string;
  at: number;
}

export interface HandEval {
  taem: number;
  pok: 8 | 9 | null;
  deng: number;
  dengLabel: string;
}

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const STARTING_CHIPS = 1000;
export const CHIP_VALUES = [5, 10, 25, 50, 100] as const;
export const MAX_PLAYERS = 6;
export const MIN_BET_DEFAULT = 10;
export const PHASE_MS: Record<Phase, number> = {
  waiting: 0,
  betting: 20000,
  dealing: 2500,
  playerAction: 15000,
  dealerAction: 2000,
  reveal: 4000,
  payout: 3000,
  nextRound: 2500,
};
