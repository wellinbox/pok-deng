import { clampBuyIn } from "@pokdeng/shared";
import type { GameRoom } from "./room.js";

export function applyBuyIn(room: GameRoom, playerId: string, buyIn?: number) {
  const players = (room as unknown as { players: { id: string; chips: number; bet: number }[] }).players;
  const p = players.find((x) => x.id === playerId);
  if (!p) return;
  if (p.chips <= 0 && p.bet <= 0) {
    p.chips = clampBuyIn(buyIn);
  }
}
