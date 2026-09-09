import { useState } from "react";
import { Lang, t } from "../i18n";

interface QuickChatProps {
  lang: Lang;
  onSend: (text: string) => void;
}

const QUICK_PHRASES = [
  { th: "สวัสดี", en: "Hello" },
  { th: "โชคดี", en: "Good luck" },
  { th: "เก่งมาก", en: "Well played" },
  { th: "รออยู่นะ", en: "Waiting..." },
  { th: "ขอโทษ", en: "Sorry" },
  { th: "ขอบคุณ", en: "Thanks" },
  { th: "โอเค", en: "OK" },
  { th: "เร็วเข้า", en: "Hurry up" },
  { th: "เยี่ยม!", en: "Nice!" },
  { th: "แย่จัง", en: "Too bad" },
];

export default function QuickChat({ lang, onSend }: QuickChatProps) {
  const [open, setOpen] = useState(false);

  const handleSend = (phrase: typeof QUICK_PHRASES[0]) => {
    onSend(phrase[lang]);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        className="fixed bottom-24 right-4 z-50 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-3 shadow-lg transition-all"
        onClick={() => setOpen(true)}
        aria-label={t(lang, "quickChat")}
      >
        <i className="fa-solid fa-comments text-xl" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 w-64 bg-gray-900/95 backdrop-blur rounded-lg shadow-xl border border-emerald-700/50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-emerald-700/50">
        <h3 className="text-emerald-100 font-semibold text-sm">{t(lang, "quickChat")}</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-emerald-300 hover:text-white transition-colors"
          aria-label={t(lang, "close")}
        >
          <i className="fa-solid fa-times" />
        </button>
      </div>
      
      <div className="p-2 grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {QUICK_PHRASES.map((phrase, i) => (
          <button
            key={i}
            onClick={() => handleSend(phrase)}
            className="bg-emerald-700/50 hover:bg-emerald-600 text-emerald-100 text-xs px-3 py-2 rounded transition-colors text-center"
          >
            {phrase[lang]}
          </button>
        ))}
      </div>
    </div>
  );
}
