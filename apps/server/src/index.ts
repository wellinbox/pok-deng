import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { clampBuyIn } from "@pokdeng/shared";
import { GameRoom } from "./room.js";

const PORT = Number(process.env.PORT || 3001);
const rooms = new Map<string, GameRoom>();
const leaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

const app = express();
app.use(cors({ origin: true }));
app.get("/health", (_req, res) => res.json({ ok: true, rooms: [...rooms.keys()] }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingInterval: 20000,
  pingTimeout: 25000,
});

function code() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function cleanCode(raw?: string) {
  return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function emitRoom(room: GameRoom) {
  const state = room.publicState();
  io.to(room.roomId).emit("state", state);
  for (const p of state.players) {
    const sock = [...io.sockets.sockets.values()].find((s) => s.data.playerId === p.id && s.connected);
    if (sock) sock.emit("holeCards", room.privateCards(p.id));
  }
}

function attach(socket: import("socket.io").Socket, room: GameRoom, playerId: string) {
  const key = `${room.roomId}:${playerId}`;
  const t = leaveTimers.get(key);
  if (t) {
    clearTimeout(t);
    leaveTimers.delete(key);
  }
  socket.data.playerId = playerId;
  socket.data.roomId = room.roomId;
  socket.join(room.roomId);
  emitRoom(room);
}

io.on("connection", (socket) => {
  const join = (payload: { roomId?: string; name: string; playerId: string; solo?: boolean; buyIn?: number; create?: boolean }) => {
    const playerId = String(payload?.playerId || "");
    const name = String(payload?.name || "ผู้เล่น").slice(0, 18);
    const chips = clampBuyIn(payload?.buyIn);
    if (!playerId) {
      socket.emit("errorMsg", "ไม่พบรหัสผู้เล่น");
      return;
    }
    socket.data.name = name;
    let room: GameRoom | undefined;

    if (payload?.solo) {
      const id = cleanCode(payload.roomId) || `SOLO${playerId.slice(0, 4)}`.toUpperCase();
      room = rooms.get(id);
      if (!room) {
        room = new GameRoom(id, playerId, name, () => emitRoom(room!), true, chips);
        rooms.set(id, room);
      } else {
        room.addPlayer(playerId, name, socket.id, undefined, false, chips);
      }
    } else if (payload?.roomId) {
      const id = cleanCode(payload.roomId);
      if (id.length < 3) {
        socket.emit("errorMsg", "รหัสห้องสั้นเกิน 3 ตัว");
        return;
      }
      room = rooms.get(id);
      if (!room) {
        room = new GameRoom(id, playerId, name, () => emitRoom(room!), false, chips);
        rooms.set(id, room);
      } else {
        const ok = room.addPlayer(playerId, name, socket.id, undefined, false, chips);
        if (!ok) {
          socket.emit("errorMsg", "ห้องเต็ม");
          return;
        }
      }
    } else {
      const id = code();
      room = new GameRoom(id, playerId, name, () => emitRoom(room!), false, chips);
      rooms.set(id, room);
    }
    attach(socket, room, playerId);
  };

  socket.on("join", join);
  socket.on("resume", join);
  socket.on("sync", () => {
    const room = rooms.get(socket.data.roomId);
    if (room) attach(socket, room, socket.data.playerId);
  });

  socket.on("bet", (amount: number) => {
    const room = rooms.get(socket.data.roomId);
    if (room) room.placeBet(socket.data.playerId, Number(amount) || 0);
  });
  socket.on("fold", () => rooms.get(socket.data.roomId)?.fold(socket.data.playerId));
  socket.on("check", () => rooms.get(socket.data.roomId)?.check(socket.data.playerId));
  socket.on("hit", () => rooms.get(socket.data.roomId)?.hit(socket.data.playerId));
  socket.on("stand", () => rooms.get(socket.data.roomId)?.stand(socket.data.playerId));
  socket.on("allin", () => rooms.get(socket.data.roomId)?.allIn(socket.data.playerId));
  socket.on("chat", (text: string) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    room.chatMsg(socket.data.playerId, String(text || ""));
    emitRoom(room);
  });
  socket.on("leave", () => {
    const room = rooms.get(socket.data.roomId);
    if (room) {
      room.disconnect(socket.data.playerId);
      emitRoom(room);
    }
    socket.leave(socket.data.roomId || "");
    socket.data.roomId = undefined;
  });

  socket.on("disconnect", () => {
    const rid = socket.data.roomId as string | undefined;
    const pid = socket.data.playerId as string | undefined;
    if (!rid || !pid) return;
    const key = `${rid}:${pid}`;
    const prev = leaveTimers.get(key);
    if (prev) clearTimeout(prev);
    leaveTimers.set(
      key,
      setTimeout(() => {
        leaveTimers.delete(key);
        const still = [...io.sockets.sockets.values()].some((s) => s.data.playerId === pid && s.data.roomId === rid && s.connected);
        if (still) return;
        const room = rooms.get(rid);
        if (room) {
          room.disconnect(pid);
          emitRoom(room);
        }
      }, 12000)
    );
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Pok Deng server on :${PORT}`);
});
