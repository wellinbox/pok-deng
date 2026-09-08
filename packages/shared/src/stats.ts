import { PlayerPrivate, LeaderboardEntry, PlayerStats } from "./types.js";

const STORAGE_KEY = "pokdeng_stats";
const LEADERBOARD_KEY = "pokdeng_leaderboard";

export function initStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalChipsWon: 0,
    bestHand: "",
    winRate: 0,
  };
}

export function loadPlayerStats(playerId: string): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initStats();
    const all = JSON.parse(raw) as Record<string, PlayerStats>;
    return all[playerId] || initStats();
  } catch {
    return initStats();
  }
}

export function savePlayerStats(playerId: string, stats: PlayerStats): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, PlayerStats>) : {};
    all[playerId] = stats;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function updatePlayerStats(
  playerId: string,
  playerName: string,
  result: "win" | "lose" | "draw",
  chipsWon: number,
  handLabel: string
): PlayerStats {
  const stats = loadPlayerStats(playerId);
  stats.gamesPlayed += 1;
  
  if (result === "win") {
    stats.wins += 1;
    stats.totalChipsWon += chipsWon;
  } else if (result === "lose") {
    stats.losses += 1;
    stats.totalChipsWon -= Math.abs(chipsWon);
  }
  // draws don't affect chips won
  
  if (handLabel && isBetterHand(handLabel, stats.bestHand)) {
    stats.bestHand = handLabel;
  }
  
  stats.winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.wins / stats.gamesPlayed) * 100) 
    : 0;
  
  savePlayerStats(playerId, stats);
  updateLeaderboard(playerId, playerName, stats);
  
  return stats;
}

function isBetterHand(newHand: string, currentBest: string): boolean {
  const handRank: Record<string, number> = {
    "ป๊อก 9": 10,
    "ป๊อก 8": 9,
    "9 แต้ม": 8,
    "8 แต้ม": 7,
    "7 แต้ม": 6,
    "6 แต้ม": 5,
    "5 แต้ม": 4,
    "4 แต้ม": 3,
    "3 แต้ม": 2,
    "2 แต้ม": 1,
    "1 แต้ม": 0,
  };
  
  // Check for deng multipliers
  const getMultiplier = (hand: string): number => {
    if (hand.includes("3 เด้ง")) return 3;
    if (hand.includes("2 เด้ง")) return 2;
    if (hand.includes("เด้ง")) return 1;
    return 0;
  };
  
  const newMult = getMultiplier(newHand);
  const currentMult = getMultiplier(currentBest);
  
  if (newMult > currentMult) return true;
  if (newMult < currentMult) return false;
  
  // Same multiplier, compare base hand
  const newBase = newHand.replace(/ \d+ เด้ง/g, "").trim();
  const currentBase = currentBest.replace(/ \d+ เด้ง/g, "").trim();
  
  return (handRank[newBase] || 0) > (handRank[currentBase] || 0);
}

export function updateLeaderboard(
  playerId: string,
  playerName: string,
  stats: PlayerStats
): void {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    let leaderboard: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
    
    const existingIndex = leaderboard.findIndex(e => e.playerId === playerId);
    const rating = calculateRating(stats);
    
    const entry: LeaderboardEntry = {
      playerId,
      name: playerName,
      avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${playerId}`,
      rating,
      gamesPlayed: stats.gamesPlayed,
      wins: stats.wins,
      winRate: stats.winRate,
    };
    
    if (existingIndex >= 0) {
      leaderboard[existingIndex] = entry;
    } else {
      leaderboard.push(entry);
    }
    
    // Sort by rating descending
    leaderboard.sort((a, b) => b.rating - a.rating);
    
    // Keep top 100
    leaderboard = leaderboard.slice(0, 100);
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  } catch {}
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function calculateRating(stats: PlayerStats): number {
  const baseRating = 1000;
  const winBonus = stats.wins * 50;
  const lossPenalty = stats.losses * 30;
  const gameBonus = Math.min(stats.gamesPlayed * 5, 500); // Cap at 500
  const winRateBonus = Math.round(stats.winRate * 0.5);
  
  return baseRating + winBonus - lossPenalty + gameBonus + winRateBonus;
}

export function getPlayerRank(playerId: string): number {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex(e => e.playerId === playerId);
  return index >= 0 ? index + 1 : -1;
}
