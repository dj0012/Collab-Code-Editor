import { io } from "socket.io-client";

// 🔥 Backend URL (auto switch for production)
const URL =
  process.env.NODE_ENV === "production"
    ? "https://your-backend-url.com"   // 👉 deployment ke time change karna
    : "http://localhost:5001";

// 🔥 Create socket
const socket = io(URL, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;