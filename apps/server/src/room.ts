import { v4 as uuid } from "uuid";
import {
  Card, ChatMessage, MAX_PLAYERS, MIN_BET_DEFAULT, PHASE_MS, Phase,
  PlayerPrivate, RoomState, STARTING_CHIPS, SeatRole, clampBuyIn, LeaderboardEntry,
  avatarUrl, createDeck, dealerShouldHit, detectPok, evaluateHand, payout, shuffle,
} from "@pokdeng/shared";

interface InternalPlayer extends PlayerPrivate { socketId: string | null; }

export class GameRoom {
  roomId: string; hostId: string; dealerId: string;
  phase: Phase = "waiting";
  players: InternalPlayer[] = [];
  pot = 0; minBet = MIN_BET_DEFAULT; maxBet = 500;
  timerEndsAt: number | null = null; currentActorId: string | null = null;
  publicMessage = "รอผู้เล่นเข้าห้อง";
  chat: ChatMessage[] = []; lastHistory: string[] = [];
  solo = false; deck: Card[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private emit: () => void;
  private actors: string[] = [];

  constructor(roomId: string, hostId: string, hostName: string, emit: () => void, solo = false, buyIn = STARTING_CHIPS) {
    this.roomId = roomId; this.hostId = hostId; this.dealerId = hostId; this.emit = emit; this.solo = solo;
    this.addPlayer(hostId, hostName, null, 0, false, buyIn);
    if (solo) {
      this.addPlayer("ai-dealer-bot", "เจ้ามือ AI", null, 4, true);
      this.dealerId = "ai-dealer-bot";
      this.addPlayer("ai-p2", "น้อง AI", null, 2, true);
      this.addPlayer("ai-p3", "เสี่ย AI", null, 6, true);
      this.addPlayer("ai-p4", "คุณนาย AI", null, 3, true);
      this.addPlayer("ai-p5", "หมอ AI", null, 5, true);
      this.addPlayer("ai-p6", "หมาย AI", null, 1, true);
      this.addPlayer("ai-p7", "หมอพล AI", null, 7, true);
      const d = this.players.find((p) => p.id === this.dealerId);
      if (d) d.role = "DEALER";
    }
  }

  addPlayer(id: string, name: string, socketId: string | null, seat?: number, isAi = false, buyIn?: number): boolean {
    const existing = this.players.find((p) => p.id === id);
    if (existing) { existing.socketId = socketId; existing.connected = true; existing.name = name || existing.name; return true; }
    if (this.players.length >= MAX_PLAYERS) return false;
    const used = new Set(this.players.map((p) => p.seat));
    let s = seat ?? 0; if (seat === undefined) while (used.has(s) && s < MAX_PLAYERS) s++;
    if (used.has(s) || s >= MAX_PLAYERS) return false;
    const chips = isAi ? Math.max(STARTING_CHIPS, clampBuyIn(buyIn)) : clampBuyIn(buyIn);
    this.players.push({
      id, name, avatar: avatarUrl(id + "-" + name), chips, bet: 0, seat: s, ready: isAi,
      folded: false, connected: !isAi, role: id === this.dealerId ? "DEALER" : null,
      cardCount: 0, cards: [], socketId, lastResult: null,
    });
    this.assignRoles(); return true;
  }

  disconnect(playerId: string) {
    const p = this.players.find((x) => x.id === playerId);
    if (p && !p.id.startsWith("ai-")) { p.connected = false; p.socketId = null; }
  }

  private assignRoles() {
    this.players.forEach((p) => { p.role = p.id === this.dealerId ? "DEALER" : p.role === "DEALER" ? null : p.role; });
    const others = this.players.filter((p) => p.id !== this.dealerId).sort((a, b) => a.seat - b.seat);
    if (others[0]) others[0].role = "SB";
    if (others[1]) others[1].role = "BB";
  }

  chatMsg(playerId: string, text: string) {
    const p = this.players.find((x) => x.id === playerId);
    if (!p || !text.trim()) return;
    const msg = { id: uuid(), playerId, name: p.name, text: text.slice(0, 140), at: Date.now() };
    this.chat.push(msg);
    this.chat = this.chat.slice(-40);
    // Broadcast new message immediately via emit
    this.emit();
  }

  placeBet(playerId: string, amount: number) {
    if (this.phase !== "waiting" && this.phase !== "betting") return;
    const p = this.players.find((x) => x.id === playerId);
    if (!p || p.id === this.dealerId) return;
    const add = Math.max(this.minBet, Math.min(amount, p.chips, this.maxBet));
    if (add <= 0) return;
    p.chips -= add; p.bet += add; this.pot += add; p.ready = true;
    if (this.phase === "waiting") this.startBetting();
    if (this.allBetsReady()) this.startDeal();
    this.emit();
  }

  fold(playerId: string) {
    const p = this.players.find((x) => x.id === playerId);
    if (!p || p.id === this.dealerId) return;
    p.folded = true; p.ready = true;
    if (this.phase === "playerAction" && this.currentActorId === playerId) this.advanceActor();
    this.emit();
  }

  check(playerId: string) {
    const p = this.players.find((x) => x.id === playerId);
    if (!p) return;
    if (this.phase === "betting" || this.phase === "waiting") {
      if (p.bet >= this.minBet || p.id === this.dealerId) p.ready = true;
      if (this.allBetsReady()) this.startDeal();
    }
    this.emit();
  }

  hit(playerId: string) {
    if (this.phase !== "playerAction" && this.phase !== "dealerAction") return;
    const p = this.players.find((x) => x.id === playerId);
    if (!p || p.folded || p.cards.length !== 2 || detectPok(p.cards)) return;
    const card = this.deck.pop(); if (!card) return;
    p.cards.push(card); p.cardCount = p.cards.length;
    if (this.phase === "playerAction") this.advanceActor(); else this.finishDealer();
    this.emit();
  }

  stand(playerId: string) {
    if (this.phase !== "playerAction" && this.phase !== "dealerAction") return;
    const p = this.players.find((x) => x.id === playerId); if (!p) return;
    if (this.phase === "playerAction") this.advanceActor(); else this.finishDealer();
    this.emit();
  }

  allIn(playerId: string) {
    const p = this.players.find((x) => x.id === playerId);
    if (!p || p.id === this.dealerId) return;
    if (this.phase !== "waiting" && this.phase !== "betting") return;
    const add = p.chips; if (add <= 0) return;
    p.chips = 0; p.bet += add; this.pot += add; p.ready = true;
    if (this.phase === "waiting") this.startBetting();
    if (this.allBetsReady()) this.startDeal();
    this.emit();
  }

  private allBetsReady() {
    const humans = this.players.filter((p) => p.id !== this.dealerId && p.connected !== false);
    return humans.length > 0 && humans.every((p) => p.ready && (p.bet >= this.minBet || p.folded));
  }

  startBetting() {
    this.phase = "betting"; this.publicMessage = "วางเดิมพันก่อนแจกไพ่";
    this.autoBetAi();
    this.setTimer(PHASE_MS.betting, () => this.startDeal()); this.emit();
  }

  private autoBetAi() {
    for (const p of this.players) {
      if (!p.id.startsWith("ai-") || p.id === this.dealerId || p.bet > 0) continue;
      const add = Math.min(this.minBet, p.chips);
      if (add <= 0) continue;
      p.chips -= add; p.bet += add; this.pot += add; p.ready = true;
    }
  }

  private startDeal() {
    this.clearTimer(); this.phase = "dealing"; this.publicMessage = "กำลังแจกไพ่…";
    this.deck = shuffle(createDeck());
    for (const p of this.players) {
      p.cards = []; p.folded = p.folded && p.bet === 0; p.revealedCards = undefined;
      p.taem = undefined; p.pok = undefined; p.deng = undefined; p.dengLabel = undefined; p.lastResult = null; p.cardCount = 0;
    }
    const order = [...this.players.filter((p) => p.id !== this.dealerId && p.bet > 0), this.players.find((p) => p.id === this.dealerId)!];
    for (let i = 0; i < 2; i++) for (const p of order) { if (!p) continue; const card = this.deck.pop(); if (card) p.cards.push(card); p.cardCount = p.cards.length; }
    this.emit(); this.setTimer(PHASE_MS.dealing, () => this.afterDeal());
  }

  private afterDeal() {
    const dealer = this.players.find((p) => p.id === this.dealerId)!;
    if (detectPok(dealer.cards) || this.players.filter((p) => p.id !== this.dealerId && p.bet > 0).every((p) => detectPok(p.cards) || p.folded)) {
      this.beginReveal(); return;
    }
    this.phase = "playerAction"; this.publicMessage = "เลือก ขอไพ่ หรือ อยู่"; this.queueActors(); this.emit();
  }

  private queueActors() {
    this.actors = this.players.filter((p) => p.id !== this.dealerId && p.bet > 0 && !p.folded && !detectPok(p.cards) && p.cards.length === 2).map((p) => p.id);
    this.advanceActor();
  }

  private advanceActor() {
    const next = this.actors.shift();
    if (!next) { this.doDealer(); return; }
    this.currentActorId = next;
    const p = this.players.find((x) => x.id === next);
    if (p?.id.startsWith("ai-")) { this.aiAct(p); return; }
    this.setTimer(PHASE_MS.playerAction, () => this.stand(next)); this.emit();
  }

  private aiAct(p: InternalPlayer) {
    const t = evaluateHand(p.cards).taem;
    setTimeout(() => { if (t <= 4) this.hit(p.id); else this.stand(p.id); }, 700);
  }

  private doDealer() {
    this.phase = "dealerAction"; this.currentActorId = this.dealerId;
    const d = this.players.find((p) => p.id === this.dealerId)!;
    this.publicMessage = "ตาเจ้ามือ"; this.emit();
    setTimeout(() => { if (dealerShouldHit(d.cards)) this.hit(d.id); else this.finishDealer(); }, 800);
  }

  private finishDealer() { this.beginReveal(); }

  private beginReveal() {
    this.phase = "reveal"; this.currentActorId = null; this.publicMessage = "เปิดไพ่";
    for (const p of this.players) if (p.cards.length) {
      const ev = evaluateHand(p.cards);
      p.revealedCards = p.cards; p.taem = ev.taem; p.pok = ev.pok; p.deng = ev.deng; p.dengLabel = ev.dengLabel;
    }
    this.emit(); this.setTimer(PHASE_MS.reveal, () => this.doPayout());
  }

  private doPayout() {
    this.phase = "payout";
    const dealer = this.players.find((p) => p.id === this.dealerId)!;
    const hist: string[] = [];
    for (const p of this.players) {
      if (p.id === dealer.id) continue;
      if (p.folded || p.bet <= 0 || p.cards.length === 0) {
        if (p.bet > 0) { p.lastResult = "lose"; hist.push(`${p.name} ทิ้งมือ เสีย ${p.bet}`); }
        continue;
      }
      const evP = evaluateHand(p.cards);
      const tag = evP.pok ? `ป๊อก ${evP.pok}` : `${evP.taem} แต้ม`;
      const deng = evP.dengLabel ? ` ${evP.dengLabel}` : "";
      const r = payout(p.cards, dealer.cards, p.bet);
      p.lastResult = r.outcome;
      
      // Update player stats (client-side only, skip on server)
      // Stats are handled by the client using shared/stats.ts
      
      if (r.outcome === "win") { p.chips += p.bet + r.playerDelta; dealer.chips = Math.max(0, dealer.chips - r.playerDelta); hist.push(`${p.name} ชนะ ${tag}${deng} +${r.playerDelta}`); }
      else if (r.outcome === "draw") { p.chips += p.bet; hist.push(`${p.name} เสมอ ${tag}`); }
      else { const extra = Math.max(0, -r.playerDelta - p.bet); p.chips = Math.max(0, p.chips - extra); dealer.chips += -r.playerDelta; hist.push(`${p.name} แพ้ ${tag}${deng} ${r.playerDelta}`); }
    }
    this.lastHistory = hist.slice(0, 8); this.publicMessage = "จ่ายเงินรอบนี้"; 
    this.emit();
    this.setTimer(PHASE_MS.payout, () => this.nextRound());
  }

  private nextRound() { this.phase = "nextRound"; this.publicMessage = "รอบใหม่กำลังเริ่ม"; this.emit(); this.setTimer(PHASE_MS.nextRound, () => this.resetRound()); }

  private resetRound() {
    this.pot = 0;
    for (const p of this.players) { p.bet = 0; p.cards = []; p.cardCount = 0; p.ready = p.id.startsWith("ai-"); p.folded = false; p.revealedCards = undefined; p.lastResult = null; }
    this.phase = "waiting"; this.publicMessage = "วางเดิมพันรอบใหม่"; this.emit();
  }

  private setTimer(ms: number, fn: () => void) {
    this.clearTimer();
    if (ms <= 0) { fn(); return; }
    this.timerEndsAt = Date.now() + ms; this.timer = setTimeout(fn, ms);
  }
  private clearTimer() { if (this.timer) clearTimeout(this.timer); this.timer = null; this.timerEndsAt = null; }

  publicState(): RoomState {
    const open = this.phase === "reveal" || this.phase === "payout" || this.phase === "nextRound";
    // Leaderboard is handled client-side
    const leaderboard: LeaderboardEntry[] = [];
    
    return {
      roomId: this.roomId, hostId: this.hostId, dealerId: this.dealerId, phase: this.phase,
      pot: this.pot, minBet: this.minBet, maxBet: this.maxBet, timerEndsAt: this.timerEndsAt,
      currentActorId: this.currentActorId, publicMessage: this.publicMessage, chat: this.chat,
      lastHistory: this.lastHistory, solo: this.solo, leaderboard,
      players: this.players.map((p) => ({
        id: p.id, name: p.name, avatar: p.avatar || avatarUrl(p.id), chips: p.chips, bet: p.bet, seat: p.seat, ready: p.ready,
        folded: p.folded, connected: p.connected, role: p.role as SeatRole, cardCount: p.cardCount,
        revealedCards: open ? p.cards : undefined, taem: open ? p.taem : undefined, pok: p.pok,
        deng: p.deng, dengLabel: open ? p.dengLabel : undefined, lastResult: p.lastResult,
      })),
    };
  }

  privateCards(playerId: string): Card[] {
    return this.players.find((p) => p.id === playerId)?.cards ?? [];
  }
}
