const { io } = require("socket.io-client");

const socket = io("http://localhost:5001");

socket.on("connect", () => {
  console.log("Connected with socket ID:", socket.id);
  const roomId = "testroom123";
  socket.emit("join_room", { roomId, username: "TestBot", avatar: null });

  setInterval(() => {
    const cursorData = {
      position: { lineNumber: 3, column: 5 },
      selection: { startLineNumber: 3, startColumn: 5, endLineNumber: 3, endColumn: 15 }
    };
    socket.emit("cursor_change", { roomId, cursorData });
    console.log("Emitted cursor_change");
  }, 1000);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});
