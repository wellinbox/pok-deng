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
        <div className={`fixed top-2 left-2 z-20 text-xs ${net === "online" ? "text-emerald-300" : "text-amber-300"}`}>
          {net === "online" ? "ออนไลน์" : net === "offline" ? "ออฟไลน์" : "กำลังต่อ..."}
        </div>
        <Landing lang={lang} setLang={setLang} onEnter={enter} />
      </>
    );
  }

  const emit = (ev: string, payload?: unknown) => sock.current?.emit(ev, payload);

  return (
    <div id="game-screen">
      <header className="game-header">
        <div className="icon-row">
          <button className="spr spr-gear" type="button" aria-label="settings" />
          <button className={`spr ${sound ? "spr-sound" : "spr-mute"}`} type="button" aria-label="sound" onClick={() => setSound((s) => !s)} />
        </div>
        <div className="logo-hex" aria-label="POK DENG" />
        <div className="icon-row">
          <button className="spr spr-bell" type="button" aria-label="alerts" />
          <button className="spr spr-menu" type="button" aria-label="menu" onClick={() => setLang(lang === "th" ? "en" : "th")} />
        </div>
      </header>

      {state.timerEndsAt && <div className="timer-line">{remain}s · {state.publicMessage}</div>}

      <section className="table-stage">
        <div className="table">
          <div className="table-center">
            <div className="pot-chips">
              <i className="chip c5 potchip" />
              <i className="chip c10 potchip" />
              <i className="chip c25 potchip" />
              <i className="chip c50 potchip" />
              <i className="chip c100 potchip" />
            </div>
            <div className="pot-box">
              <div className="pot-label">{t(lang, "pot")}</div>
              <div className="pot-value">{state.pot}</div>
            </div>
          </div>

          {[0, 1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`seat-anchor seat-${s}`}>
              <SeatView
                cls={`s${s}`}
                player={bySeat(s)}
                showCards={["reveal", "payout", "nextRound"].includes(state.phase)}
                hole={bySeat(s)?.id === me ? hole : undefined}
                rim={RIM[s]}
                crown={s === 3}
              />
            </div>
          ))}

          {mePlayer && hole.length > 0 && (
            <div className="you-hand">
              {hole.map((c, i) => (
                <PlayingCard key={c.id} card={c} i={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="action-bar">
        <div className="actions">
          <button className="gem fold" disabled={isDealer} onClick={() => emit("fold")} />
          <button className="gem check" onClick={() => emit("check")} />
          <button className="gem call" disabled={!betting || isDealer} onClick={() => emit("bet", state.minBet)} />
          <button className="gem bet" disabled={!betting || isDealer} onClick={() => emit("bet", chip)} />
          <button className="gem raise" disabled={!betting || isDealer} onClick={() => emit("bet", chip * 2)} />
          <button className="gem allin" disabled={!betting || isDealer} onClick={() => emit("allin")} />
        </div>
        <div className="tray">
          {CHIP_VALUES.map((v) => (
            <button key={v} className={`chip c${v} ${chip === v ? "on" : ""}`} onClick={() => setChip(v)} />
          ))}
        </div>
      </footer>
    </div>
  );
}
