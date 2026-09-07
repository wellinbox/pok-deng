import { Lang, t } from "../i18n";

export default function SettingsMenu({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div className="settings-menu">
      <div className="settings-kicker">{t(lang, "language").toUpperCase()}</div>
      <div className="settings-seg">
        <button className={lang === "th" ? "on" : ""} onClick={() => setLang("th")}>
          TH
        </button>
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
          EN
        </button>
      </div>
    </div>
  );
}
