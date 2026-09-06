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

const RIM: Record<number, string> = {
  1: "BB",
  2: "DEALER\nSB",
  3: "DEALER\nSB",
  5: "DEALER\nSB",
};

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
    if (s?.connected) s.emit("join", payload);
    else {
      pending.current = payload;
      s?.connect();
    }
  };

  const mePlayer = state?.players.find((p) => p.id === me);
  const isDealer = state?.dealerId === me;
  const betting = state?.phase === "waiting" || state?.phase === "betting";
  const remain = useMemo(() => {
    if (!state?.timerEndsAt) return 0;
    return Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
  }, [state]);
  const bySeat = (n: number) => state?.players.find((p) => p.seat === n);

  if (!joined || !state) {
    return (
      <>
        <div style={{ position: "fixed", top: 8, left: 8, zIndex: 20, fontSize: 12, color: net === "online" ? "#8dffb0" : "#ffd36b" }}>
          {net === "online" ? "ออนไลน์" : net === "offline" ? "ออฟไลน์" : "กำลังต่อ..."}
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
          <button className="icon-btn" title="sound" onClick={() => setSound((s) => !s)}>{sound ? "\ud83d\udd0a" : "\ud83d\udd07"}</button>
        </div>
        <div className="logo-wrap">
          <div className="logo-hex">
            <div className="th">ป๊อกเด้ง</div>
            <div className="en">POK DENG</div>
          </div>
        </div>
        <div className="icon-row right">
          <button className="icon-btn">\ud83d\udd14</button>
          <button className="icon-btn" onClick={() => setLang(lang === "th" ? "en" : "th")}>☰</button>
        </div>
      </div>
      {state.timerEndsAt && <div className="timer">{remain}s · {state.publicMessage}</div>}
      <div className="table-stage">
        <div className="table">
          <div className="table-center">
            <div className="chip-stack">
              <div className="chip c5" />
              <div className="chip c10" />
              <div className="chip c25" />
              <div className="chip c50" />
              <div className="chip c100" />
            </div>
            <div className="pot-box">
              <div className="pot-label">{t(lang, "pot")}</div>
              <div className="pot-value">{state.pot}</div>
            </div>
          </div>
          {[0, 1, 2, 3, 4, 5].map((s) => {
            const p = bySeat(s);
            return (
              <SeatView
                key={s}
                cls={`s${s}`}
                player={p}
                showCards={["reveal", "payout", "nextRound"].includes(state.phase)}
                hole={p?.id === me ? hole : undefined}
                rim={RIM[s]}
                crown={s === 3}
              />
            );
          })}
          {mePlayer && hole.length > 0 && (
            <div className="you-hand">
              {hole.map((c, i) => (
                <PlayingCard key={c.id} card={c} i={i} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bottom-bar">
        <div className="actions">
          <button className="gem fold" data-label="FOLD" disabled={isDealer} onClick={() => emit("fold")} />
          <button className="gem check" data-label="CHECK" onClick={() => emit("check")} />
          <button className="gem call" data-label="CALL" disabled={!betting || isDealer} onClick={() => emit("bet", state.minBet)} />
          <button className="gem bet" data-label="BET" disabled={!betting || isDealer} onClick={() => emit("bet", chip)} />
          <button className="gem raise" data-label="RAISE" disabled={!betting || isDealer} onClick={() => emit("bet", chip * 2)} />
          <button className="gem allin" data-label="ALL-IN" disabled={!betting || isDealer} onClick={() => emit("allin")} />
        </div>
        <div className="tray">
          {CHIP_VALUES.map((v) => (
            <button key={v} className={`chip c${v} ${chip === v ? "on" : ""}`} onClick={() => setChip(v)}>{v}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
