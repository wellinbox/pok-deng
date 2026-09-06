import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { GameRoom } from "./room.js";

const PORT = Number(process.env.PORT || 3001);

const app = express();
app.use(cors({ origin: true }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
  transports: ["polling", "websocket"],
  allowEIO3: true,
});

const rooms = new Map<string, GameRoom>();

function code() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function emitRoom(room: GameRoom) {
  const state = room.publicState();
  io.to(room.roomId).emit("state", state);
  for (const p of state.players) {
    const sock = [...io.sockets.sockets.values()].find((s) => s.data.playerId === p.id);
    if (sock) sock.emit("holeCards", room.privateCards(p.id));
  }
}

io.on("connection", (socket) => {
  socket.on("join", ({ roomId, name, playerId, solo }: { roomId?: string; name: string; playerId: string; solo?: boolean }) => {
    socket.data.playerId = playerId;
    socket.data.name = name || "ผู้เล่น";
    let room: GameRoom | undefined;
    if (solo) {
      const id = roomId || `SOLO-${playerId.slice(0, 6)}`;
      room = rooms.get(id);
      if (!room) {
        room = new GameRoom(id, playerId, socket.data.name, () => emitRoom(room!), true);
        rooms.set(id, room);
      } else {
        room.addPlayer(playerId, socket.data.name, socket.id);
      }
    } else if (roomId) {
      room = rooms.get(roomId.toUpperCase());
      if (!room) {
        socket.emit("errorMsg", "ไม่พบห้องนี้");
        return;
      }
      const ok = room.addPlayer(playerId, socket.data.name, socket.id);
      if (!ok) {
        socket.emit("errorMsg", "ห้องเต็ม");
        return;
      }
    } else {
      const id = code();
      room = new GameRoom(id, playerId, socket.data.name, () => emitRoom(room!), false);
      rooms.set(id, room);
    }
    socket.data.roomId = room.roomId;
    socket.join(room.roomId);
    emitRoom(room);
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
  socket.on("listRooms", () => {
    const list = [...rooms.values()]
      .filter((r) => !r.solo && r.phase === "waiting")
      .map((r) => ({ roomId: r.roomId, players: r.players.length, host: r.players[0]?.name }));
    socket.emit("rooms", list);
  });

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomId);
    if (room) {
      room.disconnect(socket.data.playerId);
      emitRoom(room);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Pok Deng server on :${PORT}`);
});
