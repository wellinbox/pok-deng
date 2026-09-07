import { useState } from "react";
import { MIN_BUYIN, MAX_BUYIN, STARTING_CHIPS } from "@pokdeng/shared";
import { t, Lang } from "../i18n";
import InstallHint from "../components/InstallHint";

const PRESETS = [500, 1000, 2000, 5000];

export default function Landing({
  lang,
  setLang,
  onEnter,
  error,
  busy,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onEnter: (opts: { name: string; roomId?: string; solo?: boolean; create?: boolean; buyIn: number }) => void;
  error?: string;
  busy?: boolean;
}) {
  const [name, setName] = useState(() => localStorage.getItem("pd_name") || "");
  const [code, setCode] = useState(() => localStorage.getItem("pd_last_room") || "");
  const [buyIn, setBuyIn] = useState(() => Number(localStorage.getItem("pd_buyin")) || STARTING_CHIPS);
  const [localErr, setLocalErr] = useState("");
  const lastRoom = localStorage.getItem("pd_last_room") || "";
  const fallback = t(lang, "playerDefault");

  const go = (opts: { roomId?: string; solo?: boolean; create?: boolean }) => {
    if (!opts.create && !opts.solo && !code.trim()) {
      setLocalErr(t(lang, "needCode"));
      return;
    }
    const n = name || fallback;
    const chips = Math.min(MAX_BUYIN, Math.max(MIN_BUYIN, Math.round(Number(buyIn) || STARTING_CHIPS)));
    localStorage.setItem("pd_name", n);
    localStorage.setItem("pd_buyin", String(chips));
    setLocalErr("");
    onEnter({ name: n, buyIn: chips, ...opts });
  };

  return (
    <div className="landing">
      <div className="landing-glow" aria-hidden="true" />
      <div className="landing-chips" aria-hidden="true">
        <i className="chip c100" />
        <i className="chip c25" />
        <i className="chip c10" />
        <i className="chip c50" />
        <i className="chip c5" />
      </div>

      <button className="landing-lang" type="button" onClick={() => setLang(lang === "th" ? "en" : "th")}>
        <i className="fa-solid fa-language" />
        <span>{t(lang, "langSwitch")}</span>
      </button>

      <div className="landing-card">
        <div className="landing-crest">
          <div className="logo-hex">
            <div className="th">{t(lang, "title")}</div>
            <div className="en">POK DENG</div>
          </div>
          <p className="landing-sub">{t(lang, "welcome")}</p>
          <p className="landing-tag">{t(lang, "subtitle")}</p>
        </div>

        <label className="field">
          <span><i className="fa-solid fa-user" /> {t(lang, "name")}</span>
          <input value={name} maxLength={18} onChange={(e) => setName(e.target.value)} placeholder={fallback} />
        </label>

        <label className="field">
          <span><i className="fa-solid fa-door-open" /> {t(lang, "code")}</span>
          <input
            value={code}
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
          />
        </label>
        {lastRoom && (
          <button type="button" className="last-room" onClick={() => setCode(lastRoom)}>
            <i className="fa-solid fa-clock-rotate-left" /> {t(lang, "lastRoom")}: {lastRoom}
          </button>
        )}

        <div className="field">
          <span><i className="fa-solid fa-coins" /> {t(lang, "buyIn")}</span>
          <input
            type="number"
            min={MIN_BUYIN}
            max={MAX_BUYIN}
            step={100}
            value={buyIn}
            onChange={(e) => setBuyIn(Number(e.target.value))}
          />
          <div className="buyin-presets">
            {PRESETS.map((v) => (
              <button key={v} type="button" className={buyIn === v ? "on" : ""} onClick={() => setBuyIn(v)}>
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {(localErr || error) && <div className="join-error">{localErr || error}</div>}

        <div className="row-btns">
          <button className="btn-gold" disabled={busy} onClick={() => go({ create: true })}>
            <i className="fa-solid fa-plus" /> {t(lang, "create")}
          </button>
          <button className="btn-ghost" disabled={busy} onClick={() => go({ roomId: code })}>
            <i className="fa-solid fa-right-to-bracket" /> {t(lang, "join")}
          </button>
        </div>

        <div className="or-line"><span>{t(lang, "or")}</span></div>

        <button className="btn-solo" disabled={busy} onClick={() => go({ solo: true })}>
          <i className="fa-solid fa-robot" /> {t(lang, "solo")}
        </button>

        <InstallHint lang={lang} />
      </div>
    </div>
  );
}
