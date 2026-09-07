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
  const [code, setCode] = useState("");
  const [buyIn, setBuyIn] = useState(() => Number(localStorage.getItem("pd_buyin")) || STARTING_CHIPS);
  const [localErr, setLocalErr] = useState("");
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
      <button className="icon-btn lang" onClick={() => setLang(lang === "th" ? "en" : "th")}>
        <i className="fa-solid fa-language" />
        <span style={{ marginLeft: 4 }}>{t(lang, "langSwitch")}</span>
      </button>
      <div className="landing-card">
        <div className="logo-hex" style={{ margin: "0 auto 12px", width: 200 }}>
          <div className="th">{t(lang, "title")}</div>
          <div className="en">POK DENG</div>
        </div>
        <p>{t(lang, "subtitle")}</p>
        <input placeholder={t(lang, "name")} value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder={t(lang, "code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} />
        <label className="buyin-label">{t(lang, "buyIn")}</label>
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
        {(localErr || error) && <div className="join-error">{localErr || error}</div>}
        <div className="row-btns">
          <button disabled={busy} onClick={() => go({ create: true })}>
            <i className="fa-solid fa-plus" /> {t(lang, "create")}
          </button>
          <button className="ghost" disabled={busy} onClick={() => go({ roomId: code })}>
            <i className="fa-solid fa-right-to-bracket" /> {t(lang, "join")}
          </button>
        </div>
        <button className="full-btn" style={{ width: "100%", marginTop: 10 }} disabled={busy} onClick={() => go({ solo: true })}>
          <i className="fa-solid fa-robot" /> {t(lang, "solo")}
        </button>
        <InstallHint lang={lang} />
      </div>
    </div>
  );
}
