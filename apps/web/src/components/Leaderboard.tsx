import { LeaderboardEntry } from "@pokdeng/shared";
import { Lang, t } from "../i18n";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  playerId: string;
  lang: Lang;
}

export default function Leaderboard({ entries, playerId, lang }: LeaderboardProps) {
  const myRank = entries.findIndex(e => e.playerId === playerId) + 1;
  const myEntry = entries.find(e => e.playerId === playerId);

  return (
    <div className="bg-gray-900/95 backdrop-blur rounded-lg shadow-xl border border-amber-700/50 p-4 max-w-md mx-auto">
      <h3 className="text-amber-100 font-bold text-lg mb-4 flex items-center gap-2">
        <i className="fa-solid fa-trophy text-amber-400" />
        {t(lang, "leaderboard")}
      </h3>
      
      {entries.length === 0 ? (
        <p className="text-amber-200/60 text-sm text-center py-4">{t(lang, "noGamesYet")}</p>
      ) : (
        <>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entries.slice(0, 10).map((entry, index) => (
              <div
                key={entry.playerId}
                className={`flex items-center gap-3 p-2 rounded ${
                  entry.playerId === playerId ? "bg-amber-600/30 border border-amber-500/50" : "bg-gray-800/50"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? "bg-yellow-500 text-black" :
                  index === 1 ? "bg-gray-400 text-black" :
                  index === 2 ? "bg-amber-700 text-white" :
                  "bg-gray-700 text-amber-200"
                }`}>
                  {index + 1}
                </div>
                <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full bg-gray-700" />
                <div className="flex-1 min-w-0">
                  <div className="text-amber-100 text-sm font-medium truncate">{entry.name}</div>
                  <div className="text-amber-300/60 text-xs">
                    {t(lang, "games")}: {entry.gamesPlayed} | {t(lang, "wins")}: {entry.wins} ({entry.winRate}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold">{entry.rating}</div>
                  <div className="text-amber-300/60 text-xs">{t(lang, "rating")}</div>
                </div>
              </div>
            ))}
          </div>
          
          {myEntry && myRank > 10 && (
            <div className="mt-3 pt-3 border-t border-amber-700/50">
              <div className="flex items-center gap-3 p-2 rounded bg-amber-600/30 border border-amber-500/50">
                <div className="w-6 h-6 rounded-full bg-gray-700 text-amber-200 flex items-center justify-center text-xs font-bold">
                  {myRank}
                </div>
                <img src={myEntry.avatar} alt="" className="w-8 h-8 rounded-full bg-gray-700" />
                <div className="flex-1 min-w-0">
                  <div className="text-amber-100 text-sm font-medium truncate">{myEntry.name}</div>
                  <div className="text-amber-300/60 text-xs">
                    {t(lang, "games")}: {myEntry.gamesPlayed} | {t(lang, "wins")}: {myEntry.wins} ({myEntry.winRate}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold">{myEntry.rating}</div>
                  <div className="text-amber-300/60 text-xs">{t(lang, "rating")}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
