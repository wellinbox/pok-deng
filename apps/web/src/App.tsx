import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Card, RoomState } from "@pokdeng/shared";
import { CHIP_VALUES } from "@pokdeng/shared";
import Landing from "./pages/Landing";
import SeatView from "./components/Seat";
import PlayingCard from "./components/PlayingCard";
import { Lang, t } from "./i18n";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://pok-deng-production.up.railway.app";

function uid() {
  const e = localStorage.getItem("pd_id");
  if (e) return e;
  const n = crypto.randomUUID();
  localStorage.setItem("pd_id", n);
  return n;
}

export default function App() {
  const [lang, setLang] = useState<Lang>("th");
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<RoomState | null>(null);
  const [hole, setHole] = useState<Card[]>([]);
  const [chip, setChip] = useState(10);
  const [sound, setSound] = useState(true);
  const [chat, setChat] = useState("");
  const [net, setNet] = useState<"connecting" | "online" | "offline">("connecting");
  const sock = useRef<Socket | null>(null);
  const pending = useRef<Record<string, unknown> | null>(null);
  const me = uid();

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      withCredentials: false,
      reconnection: true,
    });
    sock.current = s;
    s.on("connect", () => {
      setNet("online");
      if (pending.current) {
        s.emit("join", pending.current);
        pending.current = null;
      }
    });
    s.on("disconnect", () => setNet("offline"));
    s.on("connect_error", () => setNet("offline"));
    s.on("state", (st: RoomState) => {
      setState(st);
      setJoined(true);
    });
    s.on("holeCards", (cards: Card[]) => setHole(cards));
    s.on("errorMsg", (m: string) => alert(m));
    return () => {
      s.close();
    };
  }, []);

  const enter = (opts: { name: string; roomId?: string; solo?: boolean; create?: boolean }) => {
    const payload = {
      playerId: me,
      name: opts.name,
      roomId: opts.create ? undefined : opts.roomId,
      solo: !!opts.solo,
    };
    const s = sock.current;
    if (s?.connected) {
      s.emit("join", payload);
    } else {
      pending.current = payload;
      s?.connect();
      window.setTimeout(() => {
        if (!sock.current?.connected) {
          alert("ต่อเซิร์ฟเวอร์ไม่สำเร็จ: " + SOCKET_URL);
        }
      }, 8000);
    }
  };

  const mePlayer = state?.players.find((p) => p.id === me);
  const isDealer = state?.dealerId === me;
  const betting = state?.phase === "waiting" || state?.phase === "betting";
  const myTurn = state?.phase === "playerAction" && state.currentActorId === me;
  const remain = useMemo(() => {
    if (!state?.timerEndsAt) return 0;
    return Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
  }, [state]);

  const bySeat = (n: number) => state?.players.find((p) => p.seat === n);

  if (!joined || !state) {
    return (
      <>
        <div style={{ position: "fixed", top: 8, left: 8, zIndex: 20, fontSize: 12, color: net === "online" ? "#8dffb0" : "#ffd36b" }}>
          {net === "online" ? "ออนไลน์" : net === "offline" ? "ออฟไลน์ · " + SOCKET_URL : "กำลังต่อเซิร์ฟเวอร์..."}
        </div>
        <Landing lang={lang} setLang={setLang} onEnter={enter} />
      </>
    );
  }

  const emit = (ev: string, payload?: unknown) => sock.current?.emit(ev, payload);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="icon-row">
          <button className="icon-btn" title="settings">⚙</button>
          <button className="icon-btn" title="sound" onClick={() => setSound((s) => !s)}>
            {sound ? "🔊" : "🔇"}
          </button>
        </div>
        <div className="logo-wrap">
          <div className="logo-hex">
            <div className="th">ป๊อกเด้ง</div>
            <div className="en">POK DENG</div>
          </div>
          <div className="msg">{t(lang, "room")} {state.roomId}</div>
        </div>
        <div className="icon-row">
          <button className="icon-btn">🔔</button>
          <button className="icon-btn" onClick={() => setLang(lang === "th" ? "en" : "th")}>☰</button>
        </div>
      </div>
      {state.timerEndsAt && <div className="timer">{remain}s · {state.publicMessage}</div>}
      <div className="table-stage">
        <div className="table">
          <div className="table-center">
            <div className="chip-stack">
              <div className="chip c5" style={{ width: 28, height: 28, fontSize: 9 }}>5</div>
              <div className="chip c10" style={{ width: 28, height: 28, fontSize: 9 }}>10</div>
              <div className="chip c25" style={{ width: 28, height: 28, fontSize: 9 }}>25</div>
              <div className="chip c100" style={{ width: 28, height: 28, fontSize: 9 }}>100</div>
            </div>
            <div className="pot-label">{t(lang, "pot")}</div>
            <div className="pot-value">{state.pot}</div>
            <div className="msg">{state.publicMessage}</div>
          </div>
          {[0, 1, 2, 3, 4, 5].map((s) => {
            const p = bySeat(s);
            const isMe = p?.id === me;
            return (
              <SeatView
                key={s}
                cls={`s${s}`}
                player={p}
                showCards={["reveal", "payout", "nextRound"].includes(state.phase)}
                hole={isMe ? hole : undefined}
              />
            );
          })}
        </div>
      </div>
      {mePlayer && hole.length > 0 && !["reveal", "payout", "nextRound"].includes(state.phase) && (
        <div className="you-hand">
          {hole.map((c, i) => (
            <PlayingCard key={c.id} card={c} i={i} />
          ))}
        </div>
      )}
      <div className="bottom-bar">
        <div className="actions">
          <button className="gem fold" disabled={isDealer} onClick={() => emit("fold")}>{t(lang, "fold")}</button>
          <button className="gem check" onClick={() => emit("check")}>{t(lang, "check")}</button>
          <button className="gem call" disabled={!betting || isDealer} onClick={() => emit("bet", state.minBet)}>{t(lang, "call")}</button>
          <button className="gem bet" disabled={!betting || isDealer} onClick={() => emit("bet", chip)}>{t(lang, "bet")}</button>
          <button className="gem raise" disabled={!betting || isDealer} onClick={() => emit("bet", chip * 2)}>{t(lang, "raise")}</button>
          <button className="gem allin" disabled={!betting || isDealer} onClick={() => emit("allin")}>{t(lang, "allin")}</button>
          <button className="gem hit" disabled={!myTurn} onClick={() => emit("hit")}>{t(lang, "hit")}</button>
          <button className="gem stand" disabled={!myTurn} onClick={() => emit("stand")}>{t(lang, "stand")}</button>
        </div>
        <div className="tray">
          {CHIP_VALUES.map((v) => (
            <button key={v} className={`chip c${v} ${chip === v ? "on" : ""}`} onClick={() => setChip(v)}>{v}</button>
          ))}
        </div>
      </div>
      <div className="side-dock">
        <div className="panel">
          <h4>{t(lang, "history")}</h4>
          <div className="hist">{(state.lastHistory || []).map((h, i) => <div key={i}>{h}</div>)}</div>
        </div>
        <div className="panel">
          <h4>{t(lang, "chat")}</h4>
          <div className="chat-log">
            {state.chat.map((c) => (
              <div key={c.id}><b>{c.name}:</b> {c.text}</div>
            ))}
          </div>
          <div className="chat-row">
            <input value={chat} onChange={(e) => setChat(e.target.value)} />
            <button onClick={() => { emit("chat", chat); setChat(""); }}>{t(lang, "send")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
