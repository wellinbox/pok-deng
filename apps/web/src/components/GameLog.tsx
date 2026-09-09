import { useEffect, useRef } from "react";

interface GameLogEntry {
  id: string;
  type: "deal" | "hit" | "stand" | "bet" | "win" | "lose" | "fold" | "round";
  message: string;
  timestamp: number;
}

interface GameLogProps {
  logs: GameLogEntry[];
  onClose: () => void;
}

export default function GameLog({ logs, onClose }: GameLogProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getIcon = (type: GameLogEntry["type"]) => {
    switch (type) {
      case "deal": return "fa-cards";
      case "hit": return "fa-plus";
      case "stand": return "fa-hand";
      case "bet": return "fa-coins";
      case "win": return "fa-trophy text-yellow-400";
      case "lose": return "fa-times-circle text-red-400";
      case "fold": return "fa-folded text-gray-400";
      case "round": return "fa-flag-checkered text-green-400";
      default: return "fa-info-circle";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900/95 rounded-lg shadow-xl border border-amber-700/50 w-full max-w-md max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-amber-700/50">
          <h3 className="text-amber-100 font-semibold text-lg">
            <i className="fa-solid fa-list-ul mr-2" />
            บันทึกเกม
          </h3>
          <button
            onClick={onClose}
            className="text-amber-300 hover:text-white transition-colors"
            aria-label="ปิด"
          >
            <i className="fa-solid fa-times text-xl" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.length === 0 ? (
            <p className="text-amber-200/60 text-sm text-center py-8">ยังไม่มีบันทึก</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 text-sm bg-gray-800/50 rounded-lg p-2"
              >
                <i className={`fa-solid ${getIcon(log.type)} text-amber-400 mt-0.5`} />
                <div className="flex-1">
                  <p className="text-amber-100">{log.message}</p>
                  <span className="text-xs text-amber-300/60">
                    {new Date(log.timestamp).toLocaleTimeString("th-TH", { 
                      hour: "2-digit", 
                      minute: "2-digit", 
                      second: "2-digit" 
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}
