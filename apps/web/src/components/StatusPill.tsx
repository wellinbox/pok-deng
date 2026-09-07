import { Lang, t } from "../i18n";

export default function StatusPill({
  lang,
  net,
}: {
  lang: Lang;
  net: "connecting" | "online" | "offline";
}) {
  return (
    <div className={`status-pill ${net}`}>
      <i className="dot" />
      <span>{t(lang, net === "connecting" ? "connecting" : net)}</span>
    </div>
  );
}
