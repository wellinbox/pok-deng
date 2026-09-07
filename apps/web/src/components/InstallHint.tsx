import { useEffect, useState } from "react";
import { Lang, t } from "../i18n";

type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallHint({ lang }: { lang: Lang }) {
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const [showIos, setShowIos] = useState(false);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  useEffect(() => {
    if (standalone) return;
    const onReady = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstall);
    };
    window.addEventListener("beforeinstallprompt", onReady);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem("pd_hide_install") === "1";
    if (ios && !dismissed) setShowIos(true);
    return () => window.removeEventListener("beforeinstallprompt", onReady);
  }, [standalone]);

  if (standalone) return null;

  const hide = () => {
    localStorage.setItem("pd_hide_install", "1");
    setShowIos(false);
    setDeferred(null);
  };

  if (deferred) {
    return (
      <button
        className="install-banner"
        onClick={async () => {
          await deferred.prompt();
          hide();
        }}
      >
        {t(lang, "install")}
      </button>
    );
  }

  if (!showIos) return null;
  return (
    <div className="install-banner ios">
      <span>{t(lang, "installIos")}</span>
      <button type="button" onClick={hide}>×</button>
    </div>
  );
}
