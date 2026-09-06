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

function punch(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("punched");
  void el.offsetWidth;
  el.classList.add("punched");
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
  const myTurn =
    !!state &&
    state.phase === "playerAction" &&
    state.currentActorId === me &&
    !isDealer &&
    !mePlayer?.folded &&
    hole.length === 2;
  const remain = useMemo(() => {
    if (!state?.timerEndsAt) return 0;
    return Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
  }, [state]);
  const bySeat = (n: number) => state?.players.find((p) => p.seat === n);
  const winners = (state?.players || []).filter((p) => p.lastResult === "win");
  const showWinner = state?.phase === "payout";

  if (!joined || !state) {
    return (
      <>
        <div className={`fixed top-2 left-2 z-20 text-xs ${net === "online" ? "text-emerald-300" : "text-amber-300"}`}>
          {t(lang, net === "connecting" ? "connecting" : net)}
        </div>
        <Landing lang={lang} setLang={setLang} onEnter={enter} />
      </>
    );
  }

  const tap = (ev: string, payload?: unknown) => (e: React.MouseEvent<HTMLButtonElement>) => {
    punch(e.currentTarget);
    sock.current?.emit(ev, payload);
  };

  return (
    <div id="game-screen">
      <header className="game-header">
        <div className="icon-row">
          <button className="icon-btn" type="button" aria-label={t(lang, "settings")} onClick={(e) => punch(e.currentTarget)}>⚙</button>
          <button className="icon-btn" type="button" aria-label={t(lang, "sound")} onClick={(e) => { punch(e.currentTarget); setSound((s) => !s); }}>
            {sound ? "♪" : "×"}
          </button>
        </div>
        <div className="logo-hex">
          <div className="th">{t(lang, "title")}</div>
          <div className="en">POK DENG</div>
        </div>
        <div className="header-right">
          <div className="icon-row end">
            <button className="icon-btn" type="button" aria-label={t(lang, "alerts")} onClick={(e) => punch(e.currentTarget)}>○</button>
            <button className="icon-btn" type="button" aria-label={t(lang, "menu")} onClick={(e) => { punch(e.currentTarget); setLang(lang === "th" ? "en" : "th"); }}>
              {t(lang, "langSwitch")}
            </button>
          </div>
          <div className="wallet-hud" title={t(lang, "wallet")}>
            <span className="wallet-label">{t(lang, "wallet")}</span>
            <span className="wallet-val">{mePlayer?.chips ?? 0}</span>
          </div>
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

          {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div key={s} className={`seat-anchor seat-${s}`}>
              <SeatView
                cls={`s${s}`}
                player={bySeat(s)}
                showCards={["reveal", "payout", "nextRound"].includes(state.phase)}
                hole={bySeat(s)?.id === me ? hole : undefined}
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

        {myTurn && (
          <div className="draw-choice">
            <div className="draw-hint">{t(lang, lang === "th" ? "hit" : "hit")} / {t(lang, "stand")}</div>
            <div className="draw-row">
              <button className="draw-btn hit" onClick={tap("hit")}>{t(lang, "hit")}</button>
              <button className="draw-btn stand" onClick={tap("stand")}>{t(lang, "stand")}</button>
            </div>
          </div>
        )}

        {showWinner && (
          <div className="winner-banner" key={state.timerEndsAt || "payout"}>
            <div className="winner-title">{t(lang, "winner")}</div>
            <div className="winner-names">
              {winners.length
                ? winners.map((w) => w.name).join(" · ")
                : t(lang, mePlayer?.lastResult === "draw" ? "draw" : "youLose")}
            </div>
          </div>
        )}
      </section>

      <footer className="action-bar">
        <div className="actions">
          <button className="gem fold" disabled={isDealer} onClick={tap("fold")}>{t(lang, "fold")}</button>
          <button className="gem check" onClick={tap("check")}>{t(lang, "check")}</button>
          <button className="gem call" disabled={!betting || isDealer} onClick={tap("bet", state.minBet)}>{t(lang, "call")}</button>
          <button className="gem bet" disabled={!betting || isDealer} onClick={tap("bet", chip)}>{t(lang, "bet")}</button>
          <button className="gem raise" disabled={!betting || isDealer} onClick={tap("bet", chip * 2)}>{t(lang, "raise")}</button>
          <button className="gem allin" disabled={!betting || isDealer} onClick={tap("allin")}>{t(lang, "allin")}</button>
        </div>
        <div className="tray">
          {CHIP_VALUES.map((v) => (
            <button key={v} className={`chip c${v} ${chip === v ? "on" : ""}`} onClick={(e) => { punch(e.currentTarget); setChip(v); }}>
              {v}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
