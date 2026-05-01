const { io } = require("socket.io-client");

const socketA = io("http://localhost:5001");
const socketB = io("http://localhost:5001");

const roomId = "testroom_files";

socketA.on("connect", () => {
  socketA.emit("join_room", { roomId, username: "UserA", avatar: null });
});

socketB.on("connect", () => {
  socketB.emit("join_room", { roomId, username: "UserB", avatar: null });
});

socketB.on("room_state", (state) => {
  console.log("Room State received:", state.files ? "Has Files" : "No files");
  
  if (state.files && state.files.length > 0) {
    // UserA changes file
    setTimeout(() => {
      socketA.emit("file_change", { roomId, fileId: state.files[0].id, content: "Hello World" });
    }, 500);
  }
});

socketB.on("file_update", (data) => {
  if (data.content === "Hello World") {
    console.log("SUCCESS: UserB received file_update from UserA");
    process.exit(0);
  }
});

setTimeout(() => {
  console.log("FAILED: Did not receive file update");
  process.exit(1);
}, 3000);
