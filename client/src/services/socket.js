import { io } from "socket.io-client";

// 🔥 Backend URL (auto switch for production via Vercel env variables)
const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// 🔥 Create socket
const socket = io(URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;