const { io } = require("socket.io-client");

const socketA = io("http://localhost:5001");
const socketB = io("http://localhost:5001");

const roomId = "testroom123";

socketA.on("connect", () => {
  socketA.emit("join_room", { roomId, username: "UserA", avatar: null });
});

socketB.on("connect", () => {
  socketB.emit("join_room", { roomId, username: "UserB", avatar: null });
});

socketB.on("cursor_update", (data) => {
  if (data.cursorData.position.lineNumber === 10) {
    console.log("SUCCESS: UserB received cursor update from UserA:", data);
    process.exit(0);
  }
});

setTimeout(() => {
  socketA.emit("cursor_change", {
    roomId,
    cursorData: {
      position: { lineNumber: 10, column: 5 },
      selection: { startLineNumber: 10, startColumn: 5, endLineNumber: 10, endColumn: 5 }
    }
  });
}, 1000);

setTimeout(() => {
  console.log("FAILED: Did not receive cursor update");
  process.exit(1);
}, 3000);
