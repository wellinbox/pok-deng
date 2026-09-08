import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@pokdeng/shared";
import { Lang, t } from "../i18n";

interface ChatBoxProps {
  chat: ChatMessage[];
  playerId: string;
  onSend: (text: string) => void;
  lang: Lang;
}

export default function ChatBox({ chat, playerId, onSend, lang }: ChatBoxProps) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  if (!open) {
    return (
      <button
        className="fixed bottom-40 right-4 z-50 bg-amber-600 hover:bg-amber-500 text-white rounded-full p-3 shadow-lg transition-all"
        onClick={() => setOpen(true)}
        aria-label={t(lang, "chat")}
      >
        <i className="fa-solid fa-comments text-xl" />
        {chat.filter(m => m.playerId !== playerId).length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {chat.filter(m => m.playerId !== playerId).slice(-5).length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-40 right-4 z-50 w-72 bg-gray-900/95 backdrop-blur rounded-lg shadow-xl border border-amber-700/50 flex flex-col max-h-80">
      <div className="flex items-center justify-between p-3 border-b border-amber-700/50">
        <h3 className="text-amber-100 font-semibold text-sm">{t(lang, "chat")}</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-amber-300 hover:text-white transition-colors"
          aria-label={t(lang, "close")}
        >
          <i className="fa-solid fa-times" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {chat.length === 0 ? (
          <p className="text-amber-200/60 text-xs text-center py-4">{t(lang, "noMessages")}</p>
        ) : (
          chat.map((msg) => (
            <div
              key={msg.id}
              className={`text-xs ${msg.playerId === playerId ? "text-right" : "text-left"}`}
            >
              <span className={`inline-block max-w-[85%] rounded-lg px-2 py-1 ${
                msg.playerId === playerId 
                  ? "bg-amber-600 text-white" 
                  : "bg-gray-700 text-amber-100"
              }`}>
                <span className="font-medium opacity-75">{msg.name}: </span>
                {msg.text}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-2 border-t border-amber-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 140))}
            placeholder={t(lang, "typeMessage")}
            className="flex-1 bg-gray-800 text-amber-100 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded transition-colors"
          >
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
      </form>
    </div>
  );
}
