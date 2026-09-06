import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTaem,
  compareHands,
  detectDeng,
  detectPok,
  payout,
  Card,
} from "../src/engine.js";

function c(rank: Card["rank"], suit: Card["suit"]): Card {
  return { rank, suit, id: `${rank}_${suit}` };
}

describe("calculateTaem", () => {
  it("A=1, face=0, wraps to units", () => {
    assert.equal(calculateTaem([c("A", "hearts"), c("7", "spades")]), 8);
    assert.equal(calculateTaem([c("7", "hearts"), c("8", "spades")]), 5);
    assert.equal(calculateTaem([c("K", "hearts"), c("Q", "spades")]), 0);
    assert.equal(calculateTaem([c("10", "hearts"), c("9", "clubs")]), 9);
  });
});

describe("detectPok", () => {
  it("pok only on two cards 8 or 9", () => {
    assert.equal(detectPok([c("A", "hearts"), c("8", "spades")]), 9);
    assert.equal(detectPok([c("3", "hearts"), c("5", "spades")]), 8);
    assert.equal(detectPok([c("K", "hearts"), c("7", "spades")]), null);
    assert.equal(detectPok([c("A", "hearts"), c("8", "spades"), c("2", "clubs")]), null);
  });
});

describe("detectDeng", () => {
  it("pair and suited two-card = 2 deng", () => {
    assert.equal(detectDeng([c("5", "hearts"), c("5", "spades")]).deng, 2);
    assert.equal(detectDeng([c("3", "hearts"), c("8", "hearts")]).deng, 2);
    assert.equal(detectDeng([c("3", "hearts"), c("8", "spades")]).deng, 1);
  });
  it("tong / straight / flush three", () => {
    assert.equal(detectDeng([c("9", "hearts"), c("9", "spades"), c("9", "clubs")]).deng, 5);
    assert.equal(detectDeng([c("J", "hearts"), c("Q", "spades"), c("K", "clubs")]).deng, 3);
    assert.equal(detectDeng([c("4", "hearts"), c("5", "hearts"), c("6", "hearts")]).deng, 5);
    assert.equal(detectDeng([c("2", "hearts"), c("3", "hearts"), c("7", "hearts")]).deng, 3);
  });
});

describe("compareHands", () => {
  it("pok 9 beats pok 8, pok beats non-pok, taem otherwise", () => {
    const p9 = [c("A", "hearts"), c("8", "clubs")];
    const p8 = [c("3", "hearts"), c("5", "clubs")];
    const t7 = [c("K", "hearts"), c("7", "clubs")];
    assert.equal(compareHands(p9, p8), 1);
    assert.equal(compareHands(p8, p9), -1);
    assert.equal(compareHands(p8, t7), 1);
    assert.equal(compareHands(t7, p8), -1);
    assert.equal(compareHands(t7, [c("3", "spades"), c("4", "diamonds")]), 0);
  });
});

describe("payout", () => {
  it("pays winner deng times bet", () => {
    const pair8 = [c("4", "hearts"), c("4", "spades")];
    const low = [c("2", "clubs"), c("3", "diamonds")];
    const r = payout(pair8, low, 100);
    assert.equal(r.outcome, "win");
    assert.equal(r.playerDelta, 200);
    const draw = payout(low, [c("A", "hearts"), c("4", "spades")], 50);
    assert.equal(draw.outcome, "draw");
    assert.equal(draw.playerDelta, 0);
  });
});
