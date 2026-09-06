# ป๊อกเด้ง · POK DENG

Thai Pok Deng online — luxury felt + gold UI.

- Frontend: Vite + React + TypeScript (`apps/web`)
- Realtime: Node.js + Express + Socket.IO (`apps/server`)
- Logic: `@pokdeng/shared` (taem / pok / deng / payout)

In-game chips only. Start with 1,000. No real-money payments.

## Dev

```bash
cp .env.example .env
npm install
npm test
npm run dev
```

Web: http://localhost:5173  
Server: http://localhost:3001  

`VITE_SOCKET_URL=http://localhost:3001`

Use **Solo vs AI** or open two tabs for multiplayer.

## Rules (short)

52-card deck. A=1, 2–9 face, 10/J/Q/K=0. Score = units digit.

1. Bet before deal
2. Two cards each, dealer last
3. Two-card 8 or 9 = Pok (9 beats 8)
4. Otherwise Hit one card or Stand
5. Compare vs dealer only

Deng: suited/pair 2x, three-face/straight 3x, tong/straight-flush 5x

## Deploy

Vercel frontend (`apps/web`), env `VITE_SOCKET_URL` to Railway/Render server.
Server env: `PORT`, `CLIENT_ORIGIN`.
Do not run Socket.IO on Vercel serverless.
