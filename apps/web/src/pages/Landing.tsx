import { useState } from "react";
import { t, Lang } from "../i18n";

export default function Landing({
  lang,
  setLang,
  onEnter,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onEnter: (opts: { name: string; roomId?: string; solo?: boolean; create?: boolean }) => void;
}) {
  const [name, setName] = useState(() => localStorage.getItem("pd_name") || "");
  const [code, setCode] = useState("");
  const fallback = t(lang, "playerDefault");
  const go = (opts: { roomId?: string; solo?: boolean; create?: boolean }) => {
    const n = name || fallback;
    localStorage.setItem("pd_name", n);
    onEnter({ name: n, ...opts });
  };
  return (
    <div className="landing">
      <button className="icon-btn lang" onClick={() => setLang(lang === "th" ? "en" : "th")}>
        {t(lang, "langSwitch")}
      </button>
      <div className="landing-card">
        <div className="logo-hex" style={{ margin: "0 auto 12px", width: 200 }}>
          <div className="th">{t(lang, "title")}</div>
          <div className="en">POK DENG</div>
        </div>
        <p>{t(lang, "subtitle")}</p>
        <input placeholder={t(lang, "name")} value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder={t(lang, "code")} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} />
        <div className="row-btns">
          <button onClick={() => go({ create: true })}>{t(lang, "create")}</button>
          <button className="ghost" onClick={() => go({ roomId: code })}>{t(lang, "join")}</button>
        </div>
        <button className="full-btn" style={{ width: "100%", marginTop: 10 }} onClick={() => go({ solo: true })}>
          {t(lang, "solo")}
        </button>
      </div>
    </div>
  );
}
