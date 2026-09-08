import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Card, RoomState, ChatMessage } from "@pokdeng/shared";
import { STARTING_CHIPS, clampBuyIn, GameConfig } from "@pokdeng/shared";
import Landing from "./pages/Landing";
import SeatView from "./components/Seat";
import ResultsBoard from "./components/ResultsBoard";
import PotHeap from "./components/PotHeap";
import SettingsMenu from "./components/SettingsMenu";
import BrokeBar from "./components/BrokeBar";
import Toast from "./components/Toast";
import ChipTray from "./components/ChipTray";
import ChatBox from "./components/ChatBox";
import { Lang, t } from "./i18n";
import { money } from "./lib/money";
import { soundManager, SoundKey, preloadSounds } from "./lib/sound";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://pok-deng-production.up.railway.app";

type Session = { roomId: string; name: string; solo: boolean; buyIn: number };

function uid() {
  const e = localStorage.getItem("pd_id");
  if (e) return e;
  const n = crypto.randomUUID();
  localStorage.setItem("pd_id", n);
  return n;
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem("pd_session");
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(s: Session) {
  localStorage.setItem("pd_session", JSON.stringify(s));
}

function punch(el: HTMLElement | null) {
  if (!el) return;
  el.classList.remove("punched");
  void el.offsetWidth;
  el.classList.add("punched");
}

export default function App() {
  const [lang, setLang] = useState<Lang>("th");
  const [joined, setJoined] = useState(() => !!loadSession());
  const [state, setState] = useState<RoomState | null>(null);
  const [hole, setHole] = useState<Card[]>([]);
  const [chip, setChip] = useState(10);
  const [sound, setSound] = useState(true);
  const [menu, setMenu] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [joinErr, setJoinErr] = useState("");
  const [toast, setToast] = useState<{ text: string; kind?: "info" | "error" | "ok" } | null>(null);
  const [splash, setSplash] = useState(true);
  const [net, setNet] = useState<"connecting" | "online" | "offline">("connecting");
  const sock = useRef<Socket | null>(null);
  const session = useRef<Session | null>(loadSession());
  const stay = useRef(!!loadSession());
  const me = uid();

  // Sync sound state with soundManager
  useEffect(() => {
    soundManager.setEnabled(sound);
    if (sound) {
      // Preload sounds on first enable
      preloadSounds();
    }
  }, [sound]);

  const emitJoin = (s: Socket, sess: Session) => {
    if (!stay.current) return;
    s.emit("join", {
      playerId: me,
      name: sess.name,
      roomId: sess.roomId || undefined,
      solo: sess.solo,
      buyIn: clampBuyIn(sess.buyIn),
    });
  };

  const resumeNow = () => {
    if (!stay.current) return;
    const s = sock.current;
    const sess = session.current;
    if (!s || !sess) return;
    if (!s.connected) s.connect();
    else emitJoin(s, sess);
  };

  const leaveRoom = () => {
    const rid = state?.roomId || session.current?.roomId;
    if (rid) localStorage.setItem("pd_last_room", rid);
    stay.current = false;
    sock.current?.emit("leave");
    session.current = null;
    localStorage.removeItem("pd_session");
    setHole([]);
    setState(null);
    setJoined(false);
    setMenu(false);
    setJoinErr("");
  };

  useEffect(() => {
    const hide = window.setTimeout(() => setSplash(false), 1200);
    return () => window.clearTimeout(hide);
  }, []);

  useEffect(() => {
    if (!joinErr) return;
    setToast({ text: joinErr, kind: "error" });
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [joinErr]);

  useEffect(() => {
    if (net !== "offline") return;
    setToast({ text: t(lang, "reconnecting"), kind: "info" });
  }, [net, lang]);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 400,
      reconnectionDelayMax: 4000,
      timeout: 12000,
      autoConnect: true,
    });
    sock.current = s;
    s.on("connect", () => {
      setNet("online");
      if (stay.current && session.current) emitJoin(s, session.current);
    });
    s.on("disconnect", () => setNet("offline"));
    s.on("connect_error", () => setNet("offline"));
    s.on("state", (st: RoomState) => {
      if (!stay.current) return;
      setJoinErr("");
      setState(st);
      setJoined(true);
      const prev = session.current;
      const next: Session = {
        roomId: st.roomId,
        name: prev?.name || localStorage.getItem("pd_name") || "ผู้เล่น",
        solo: st.solo,
        buyIn: clampBuyIn(prev?.buyIn || Number(localStorage.getItem("pd_buyin")) || STARTING_CHIPS),
      };
      session.current = next;
      saveSession(next);
      // Reset chat when joining new room
      setChat([]);
    });
    s.on("chatHistory", (history: ChatMessage[]) => {
      setChat(history.slice(-40));
    });
    s.on("chatMessage", (msg: ChatMessage) => {
      setChat(prev => [...prev.slice(-39), msg]);
    });
    s.on("holeCards", (cards: Card[]) => {
      if (!stay.current) return;
      setHole(cards);
      // Play card deal sound when receiving cards
      if (sound && cards.length > 0) {
        soundManager.play("cardDeal");
      }
    });
    s.on("errorMsg", (m: string) => {
      setJoinErr(m);
      if (m === "ห้องเต็ม") {
        stay.current = false;
        session.current = null;
        localStorage.removeItem("pd_session");
        setJoined(false);
        setState(null);
      }
    });
    s.on("sessionGone", () => {
      stay.current = false;
      session.current = null;
      localStorage.removeItem("pd_session");
      setJoined(false);
      setState(null);
      setToast({ text: t(lang, "offline"), kind: "error" });
    });
    const wake = () => {
      if (document.visibilityState === "hidden") return;
      resumeNow();
    };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("pageshow", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    if (stay.current && session.current && s.connected) emitJoin(s, session.current);
    return () => {
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      s.close();
    };
  }, []);

  const enter = (opts: { name: string; roomId?: string; solo?: boolean; create?: boolean; buyIn: number }) => {
    const payload: Session = {
      name: opts.name,
      roomId: opts.create ? "" : opts.solo ? `SOLO${me.slice(0, 4)}`.toUpperCase() : (opts.roomId || "").toUpperCase(),
      solo: !!opts.solo,
      buyIn: clampBuyIn(opts.buyIn),
    };
    stay.current = true;
    session.current = payload;
    saveSession(payload);
    setJoinErr("");
    setJoined(true);
    const s = sock.current;
    if (!s) return;
    if (s.connected) emitJoin(s, payload);
    else s.connect();
  };

  const mePlayer = state?.players.find((p) => p.id === me);
  const isDealer = state?.dealerId === me;
  const betting = state?.phase === "waiting" || state?.phase === "betting";
  const revealed = ["reveal", "payout", "nextRound"].includes(state?.phase || "");
  const dealing = state?.phase === "dealing";
  const broke = !!mePlayer && !isDealer && (mePlayer.chips || 0) <= 0 && (mePlayer.bet || 0) <= 0;
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
  }, [state, net]);
  const bySeat = (n: number) => state?.players.find((p) => p.seat === n);
  const showBoard = state?.phase === "payout" || state?.phase === "reveal";
  const splashUi = splash ? (
    <div className="splash">
      <div className="splash-mark">
        <div className="th">ป๊อกเด้ง</div>
        <div className="en">POK DENG</div>
        <div className="splash-spin" />
      </div>
    </div>
  ) : null;
  const toastUi = toast ? <Toast text={toast.text} kind={toast.kind} onClose={() => setToast(null)} /> : null;

  if (!joined || !state) {
    return (
      <>
        {splashUi}
        {toastUi}
        <Landing lang={lang} setLang={setLang} onEnter={enter} error={joinErr} busy={joined && !state} net={net} />
      </>
    );
  }

  const tap = (ev: string, payload?: unknown) => (e: React.MouseEvent<HTMLButtonElement>) => {
    punch(e.currentTarget);
    sock.current?.emit(ev, payload);
    // Play button click sound
    if (sound) {
      soundManager.play("buttonClick");
    }
  };

  const sendChat = (text: string) => {
    sock.current?.emit("chat", text);
  };

  return (
    <div id="game-screen">
      {splashUi}
      {toastUi}
      {net !== "online" && (
        <div className="fixed inset-x-0 top-0 z-30 bg-amber-900/90 text-center text-xs py-1 text-amber-100">
          {t(lang, "reconnecting")}
        </div>
      )}
      <header className="game-header">
        <div className="icon-row">
          <div className="settings-wrap">
            <button className="icon-btn" type="button" aria-label={t(lang, "settings")} onClick={(e) => { punch(e.currentTarget); setMenu((v) => !v); }}>
              <i className="fa-solid fa-gear" />
            </button>
            {menu && <SettingsMenu lang={lang} setLang={setLang} />}
          </div>
          <button className="icon-btn" type="button" aria-label={t(lang, "sound")} onClick={(e) => { punch(e.currentTarget); setSound((v) => !v); if (sound) soundManager.play("buttonClick"); }}>
            <i className={`fa-solid ${sound ? "fa-volume-high" : "fa-volume-xmark"}`} />
          </button>
          <button className="icon-btn" type="button" aria-label={t(lang, "alerts")} onClick={(e) => { punch(e.currentTarget); resumeNow(); }}>
            <i className="fa-solid fa-bell" />
          </button>
        </div>
        <div className="header-right">
          <button className="room-code" type="button" title={t(lang, "copy")} onClick={() => navigator.clipboard?.writeText(state.roomId)}>
            {t(lang, "room")} {state.roomId}
          </button>
          <div className="wallet-hud" title={t(lang, "wallet")}>
            <span className="wallet-label">{t(lang, "wallet")}</span>
            <span className="wallet-val">{money(mePlayer?.chips)}</span>
          </div>
          <button className="leave-room" type="button" onClick={leaveRoom} aria-label={t(lang, "leave")} title={t(lang, "leave")}>
            <i className="fa-solid fa-right-from-bracket" />
          </button>
        </div>
      </header>

      {state.timerEndsAt && <div className="timer-line">{remain}s · {state.publicMessage}</div>}

      <section className="table-stage">
        <div className="table-bg" />
        <div className="table">
          <div className="table-center">
            <PotHeap amount={state.pot} />
          </div>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div key={s} className={`seat-anchor seat-${s}`}>
              <SeatView
                cls={`s${s}`}
                player={bySeat(s)}
                showCards={revealed}
                hole={bySeat(s)?.id === me ? hole : undefined}
                dealing={dealing}
              />
            </div>
          ))}
        </div>
        {myTurn && (
          <div className="draw-choice">
            <div className="draw-hint">{t(lang, "hit")} / {t(lang, "stand")}</div>
            <div className="draw-row">
              <button className="draw-btn hit" onClick={tap("hit")}>
                <i className="fa-solid fa-plus" /> {t(lang, "hit")}
              </button>
              <button className="draw-btn stand" onClick={tap("stand")}>
                <i className="fa-solid fa-hand" /> {t(lang, "stand")}
              </button>
            </div>
          </div>
        )}
        {showBoard && <ResultsBoard players={state.players} lang={lang} />}
      </section>

      {broke && <BrokeBar lang={lang} onLeave={leaveRoom} />}

      <footer className="action-bar">
        <div className="actions">
          <button className="gem fold" disabled={isDealer || broke} onClick={tap("fold")}>
            <i className="fa-solid fa-hand" /><span>{t(lang, "fold")}</span>
          </button>
          <button className="gem check" disabled={broke} onClick={tap("check")}>
            <i className="fa-solid fa-check" /><span>{t(lang, "check")}</span>
          </button>
          <button className="gem call" disabled={!betting || isDealer || broke} onClick={tap("bet", state.minBet)}>
            <i className="fa-solid fa-reply" /><span>{t(lang, "call")}</span>
          </button>
          <button className="gem bet" disabled={!betting || isDealer || broke} onClick={tap("bet", chip)}>
            <i className="fa-solid fa-coins" /><span>{t(lang, "bet")}</span>
          </button>
          <button className="gem raise" disabled={!betting || isDealer || broke} onClick={tap("bet", chip * 2)}>
            <i className="fa-solid fa-angles-up" /><span>{t(lang, "raise")}</span>
          </button>
          <button className="gem allin" disabled={!betting || isDealer || broke} onClick={(e) => {
            punch(e.currentTarget);
            sock.current?.emit("allin");
            if (sound) soundManager.play("allIn");
          }}>
            <i className="fa-solid fa-bolt" /><span>{t(lang, "allin")}</span>
          </button>
        </div>
        <ChipTray chip={chip} onPick={(v, el) => { 
          punch(el); 
          setChip(v); 
          if (sound) soundManager.play("chipClick");
        }} />
      </footer>

      <ChatBox chat={chat} playerId={me} onSend={sendChat} lang={lang} />
    </div>
  );
}
