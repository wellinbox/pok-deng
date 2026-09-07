import { t, Lang } from "../i18n";

export default function BrokeBar({
  lang,
  onLeave,
}: {
  lang: Lang;
  onLeave: () => void;
}) {
  return (
    <div className="broke-bar">
      <div>
        <strong>{t(lang, "brokeTitle")}</strong>
        <p>{t(lang, "brokeHint")}</p>
      </div>
      <button type="button" onClick={onLeave}>
        <i className="fa-solid fa-right-from-bracket" /> {t(lang, "brokeLeave")}
      </button>
    </div>
  );
}
