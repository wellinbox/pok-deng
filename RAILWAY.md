# ใช้ Socket บน Railway

Vercel = หน้าเว็บ
Railway = Socket.IO ห้องเกม

## 1. New Project → Deploy from GitHub → wellinbox/pok-deng

## 2. Variables
CLIENT_ORIGIN=https://YOUR-APP.vercel.app

## 3. Generate Domain
เช่น https://xxxxx.up.railway.app/health ต้องได้ {"ok":true}

## 4. Vercel env แล้ว Redeploy
VITE_SOCKET_URL=https://xxxxx.up.railway.app
