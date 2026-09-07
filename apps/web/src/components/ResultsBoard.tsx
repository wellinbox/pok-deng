import type { PlayerPublic } from "@pokdeng/shared";
import { Lang, t } from "../i18n";

function score(p: PlayerPublic) {
  if (p.folded || !p.cardCount) return -1;
  if (p.pok === 9) return 209;
  if (p.pok === 8) return 208;
  return p.taem ?? 0;
}

function label(p: PlayerPublic, lang: Lang) {
  if (p.folded) return lang === "th" ? "พับ" : "FOLD";
  if (p.pok) return lang === "th" ? `ป๊อก ${p.pok}` : `POK ${p.pok}`;
  if (p.taem != null) return lang === "th" ? `${p.taem} แต้ม` : `${p.taem} pts`;
  return "—";
}

function resultTag(p: PlayerPublic, lang: Lang) {
  if (p.lastResult === "win") return t(lang, "youWin").replace("!", "");
  if (p.lastResult === "draw") return t(lang, "draw");
  if (p.lastResult === "lose") return t(lang, "youLose");
  return "";
}

export default function ResultsBoard({
  players,
  lang,
}: {
  players: PlayerPublic[];
  lang: Lang;
}) {
  const rows = [...players]
    .filter((p) => p.bet > 0 || (p.cardCount || 0) > 0 || p.role === "DEALER")
    .sort((a, b) => score(b) - score(a));

  return (
    <div className="winner-banner scoreboard" key="board">
      <div className="winner-title">{t(lang, "winner")}</div>
      <div className="score-table">
        <div className="score-head">
          <span>#</span>
          <span>{lang === "th" ? "ผู้เล่น" : "Player"}</span>
          <span>{lang === "th" ? "แต้ม" : "Pts"}</span>
          <span>{lang === "th" ? "ผล" : "Result"}</span>
        </div>
        {rows.map((p, i) => (
          <div key={p.id} className={`score-row ${p.lastResult || ""} ${p.role === "DEALER" ? "dealer" : ""}`}>
            <span>{i + 1}</span>
            <span className="score-name">{p.name}{p.dengLabel ? ` · ${p.dengLabel}` : ""}</span>
            <span className="score-pts">{label(p, lang)}</span>
            <span className="score-res">{resultTag(p, lang)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
