const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { askAI } = require("./ai");
const mongoose = require("mongoose");
const Room = require("./models/Room");

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));
} else {
  console.log("No MONGODB_URI provided. Running in memory-only mode.");
}

let rooms = {};

const app = express();

const ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean);

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(apiLimiter);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS },
});

const DEFAULT_LANGUAGE = {
  label: "JavaScript",
  value: "javascript",
  judge0Id: 63,
};

const getRoomState = (roomId) => {
  const room = rooms[roomId];

  if (!room) return null;

  const adminUser = room.users.find((user) => user.socketId === room.adminId);

  return {
    users: room.users,
    files: room.files,
    adminId: room.adminId,
    adminUsername: adminUser?.username || "",
    isLocked: room.isLocked || false,
    isReadOnly: room.isReadOnly || false,
    isChatMuted: room.isChatMuted || false,
  };
};

const emitRoomState = (roomId) => {
  const roomState = getRoomState(roomId);

  if (!roomState) return;

  io.to(roomId).emit("room_state", roomState);
  io.to(roomId).emit(
    "update_users",
    roomState.users.map((user) => user.username)
  );
};

const removeUserFromRoom = (roomId, socketId) => {
  const room = rooms[roomId];

  if (!room) return;

  room.users = room.users.filter((user) => user.socketId !== socketId);
  io.to(roomId).emit("cursor_remove", { socketId });

  if (room.adminId === socketId) {
    room.adminId = room.users[0]?.socketId || null;
  }

  if (room.users.length === 0) {
    delete rooms[roomId];
    return;
  }

  emitRoomState(roomId);
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔥 JOIN ROOM
  socket.on("join_room", async ({ roomId, username, avatar }) => {
    socket.join(roomId);

    socket.username = username;
    socket.roomId = roomId;

    if (!rooms[roomId]) {
      let dbRoom = null;
      if (process.env.MONGODB_URI) {
        try {
          dbRoom = await Room.findOne({ roomId });
        } catch (err) {
          console.error("Error fetching room from DB:", err);
        }
      }

      if (dbRoom) {
        rooms[roomId] = {
          adminId: socket.id, // First person to revive the room becomes admin
          users: [],
          files: dbRoom.files || [],
          whiteboard: [],
          messages: dbRoom.messages || [],
          isLocked: dbRoom.isLocked || false,
          isReadOnly: dbRoom.isReadOnly || false,
          isChatMuted: dbRoom.isChatMuted || false,
        };
      } else {
        rooms[roomId] = {
          adminId: socket.id,
          users: [],
          files: [],
          whiteboard: [],
          messages: [],
          isLocked: false,
          isReadOnly: false,
          isChatMuted: false,
        };
      }
    }

    const room = rooms[roomId];
    const alreadyJoined = room.users.some((user) => user.socketId === socket.id);

    if (room.isLocked && !alreadyJoined) {
      socket.emit("join_rejected", { reason: "Room is locked by the admin." });
      return;
    }

    if (!alreadyJoined) {
      room.users.push({ socketId: socket.id, username, avatar: avatar || null, canEdit: false });
    } else {
      // Update avatar if already joined
      const user = room.users.find((u) => u.socketId === socket.id);
      if (user) user.avatar = avatar || null;
    }

    console.log(`${username} joined room ${roomId}`);

    emitRoomState(roomId);
    socket.emit("receive_output", room.output);
    socket.emit("chat_history", room.messages);
    socket.emit("whiteboard_state", room.whiteboard);
    socket.to(roomId).emit("user_joined", username);
  });

  // 🔥 FILE SYNC
  socket.on("file_change", ({ roomId, fileId, content }) => {
    if (typeof content !== "string" || content.length > 100000) return; // Limit to ~100KB
    const room = rooms[roomId];
    if (room) {
      const user = room.users.find(u => u.socketId === socket.id);
      if (room.isReadOnly && room.adminId !== socket.id && (!user || !user.canEdit)) return; // ENFORCE READ-ONLY
      const file = room.files.find(f => f.id === fileId);
      if (file) {
        file.content = content;
      }
    }
    socket.to(roomId).emit("file_update", { fileId, content });
  });

  const BOILERPLATES = {
    javascript: `// Welcome to Collab Code Editor
// Write your JavaScript code here

console.log("Hello, World!");`,
    python: `# Welcome to Collab Code Editor
# Write your Python code here

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
    java: `// Welcome to Collab Code Editor
// Note: The public class name must match the file name

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    cpp: `// Welcome to Collab Code Editor

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
    c: `// Welcome to Collab Code Editor

#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`
  };

  socket.on("create_file", ({ roomId, name, language }) => {
    const room = rooms[roomId];
    if (room) {
      const lang = language || DEFAULT_LANGUAGE;
      const initialContent = lang !== "whiteboard" && BOILERPLATES[lang] 
        ? BOILERPLATES[lang] 
        : "";
        
      const newFile = { 
        id: Date.now().toString(), 
        name, 
        content: initialContent, 
        language: lang 
      };
      room.files.push(newFile);
      io.to(roomId).emit("file_created", newFile);
    }
  });

  socket.on("delete_file", ({ roomId, fileId }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      room.files = room.files.filter(f => f.id !== fileId);
      io.to(roomId).emit("file_deleted", fileId);
    }
  });

  socket.on("rename_file", ({ roomId, fileId, newName }) => {
    const room = rooms[roomId];
    if (room) {
      const file = room.files.find(f => f.id === fileId);
      if (file) {
        file.name = newName;
        io.to(roomId).emit("file_renamed", { fileId, newName });
      }
    }
  });

  // 🔥 CURSOR SYNC
  socket.on("cursor_change", ({ roomId, cursorData }) => {
    socket.to(roomId).emit("cursor_update", { socketId: socket.id, cursorData });
  });

  // 🔥 OUTPUT SYNC
  socket.on("add_file_execution", ({ roomId, fileId, execution }) => {
    console.log(`Received add_file_execution for room ${roomId}, file ${fileId}`);
    if (rooms[roomId]) {
      const file = rooms[roomId].files.find(f => f.id === fileId);
      if (file) {
        if (!file.executions) file.executions = [];
        file.executions.push(execution);
      }
    }
    io.to(roomId).emit("receive_file_execution", { fileId, execution });
  });

  socket.on("clear_file_executions", ({ roomId, fileId }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      const file = room.files.find(f => f.id === fileId);
      if (file) {
        file.executions = [];
        io.to(roomId).emit("file_executions_cleared", { fileId });
      }
    }
  });

  socket.on("update_avatar", ({ roomId, avatar }) => {
    const room = rooms[roomId];
    if (room) {
      const user = room.users.find(u => u.socketId === socket.id);
      if (user) {
        user.avatar = avatar;
        emitRoomState(roomId);
      }
    }
  });

  socket.on("set_language", ({ roomId, fileId, language }) => {
    const room = rooms[roomId];
    if (!room || room.adminId !== socket.id) return;
    const file = room.files.find(f => f.id === fileId);
    if (file) {
      file.language = language;
      io.to(roomId).emit("language_updated", { fileId, language });
    }
  });

  socket.on("reset_code", ({ roomId, fileId }) => {
    const room = rooms[roomId];

    if (!room || room.adminId !== socket.id) return;

    const file = room.files.find(f => f.id === fileId);
    if (file) {
      file.content = "";
      io.to(roomId).emit("file_update", { fileId, content: "" });
    }
  });

  socket.on("assign_admin", ({ roomId, newAdminId }) => {
    const room = rooms[roomId];
    if (!room || room.adminId !== socket.id) return; // Only current admin can reassign

    // Verify the new admin is actually in the room
    const userExists = room.users.some(user => user.socketId === newAdminId);
    if (userExists) {
      room.adminId = newAdminId;
      emitRoomState(roomId);
    }
  });

  socket.on("kick_user", ({ roomId, targetSocketId }) => {
    const room = rooms[roomId];

    if (!room || room.adminId !== socket.id || targetSocketId === socket.id) return;

    const targetSocket = io.sockets.sockets.get(targetSocketId);

    if (!targetSocket) {
      removeUserFromRoom(roomId, targetSocketId);
      return;
    }

    targetSocket.emit("removed_from_room", {
      roomId,
      reason: "The admin removed you from the room.",
    });
    targetSocket.leave(roomId);
    targetSocket.roomId = null;
    targetSocket.username = null;

    removeUserFromRoom(roomId, targetSocketId);
  });

  // 🔥 ADMIN MODERATION CONTROLS
  socket.on("toggle_room_lock", ({ roomId, isLocked }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      room.isLocked = isLocked;
      emitRoomState(roomId);
    }
  });

  socket.on("force_sync_tab", ({ roomId, fileId }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      socket.to(roomId).emit("force_tab_switch", fileId);
    }
  });

  socket.on("global_announcement", ({ roomId, message }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      io.to(roomId).emit("receive_announcement", { message, sender: room.users.find(u => u.socketId === socket.id)?.username || 'Admin' });
    }
  });

  socket.on("toggle_read_only", ({ roomId, isReadOnly }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      room.isReadOnly = isReadOnly;
      emitRoomState(roomId);
    }
  });

  socket.on("toggle_chat_mute", ({ roomId, isChatMuted }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      room.isChatMuted = isChatMuted;
      emitRoomState(roomId);
    }
  });

  socket.on("kick_all_users", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      // Find all users except admin
      const usersToKick = room.users.filter(u => u.socketId !== socket.id);
      
      // Keep track of socket IDs to remove after iterating
      const socketIdsToRemove = [];

      usersToKick.forEach(u => {
        const targetSocket = io.sockets.sockets.get(u.socketId);
        if (targetSocket) {
          targetSocket.emit("removed_from_room", { roomId, reason: "The admin has ended the session." });
          targetSocket.leave(roomId);
          targetSocket.roomId = null;
          targetSocket.username = null;
        }
        socketIdsToRemove.push(u.socketId);
      });

      // Remove them from room state
      socketIdsToRemove.forEach(sid => removeUserFromRoom(roomId, sid));
    }
  });

  socket.on("toggle_user_access", ({ roomId, targetSocketId }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.id) {
      const targetUser = room.users.find(u => u.socketId === targetSocketId);
      if (targetUser) {
        targetUser.canEdit = !targetUser.canEdit;
        emitRoomState(roomId);
      }
    }
  });

  // 🔥 CHAT
  socket.on("send_message", ({ roomId, message, username }) => {
    const room = rooms[roomId];

    if (!room) return;
    const user = room.users.find(u => u.socketId === socket.id);
    if (room.isChatMuted && room.adminId !== socket.id && (!user || !user.canEdit)) return; // ENFORCE CHAT MUTE
    if (typeof message !== "string" || !message.trim() || message.length > 500) return; // Validation

    const chatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: message.trim(),
      username: String(username).slice(0, 50),
      createdAt: new Date().toISOString(),
    };

    room.messages.push(chatMessage);

    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    io.to(roomId).emit("receive_message", chatMessage);
  });

  // 🔥 WHITEBOARD SYNC (Legacy Canvas)
  socket.on("draw_line", ({ roomId, fileId, line }) => {
    const room = rooms[roomId];
    if (room) {
      const file = room.files.find(f => f.id === fileId);
      if (file) {
        if (!file.whiteboard) file.whiteboard = [];
        file.whiteboard.push(line);
        if (file.whiteboard.length > 5000) file.whiteboard.shift();
      }
    }
    socket.to(roomId).emit("receive_draw_line", { fileId, line });
  });

  // 🔥 EXCALIDRAW SYNC
  socket.on("update_excalidraw", ({ roomId, fileId, elements }) => {
    const room = rooms[roomId];
    if (room) {
      const file = room.files.find(f => f.id === fileId);
      if (file) {
        file.whiteboard = elements;
      }
    }
    socket.to(roomId).emit("receive_excalidraw", { fileId, elements });
  });

  socket.on("clear_whiteboard", ({ roomId, fileId }) => {
    const room = rooms[roomId];
    if (room) {
      const file = room.files.find(f => f.id === fileId);
      if (file) file.whiteboard = [];
    }
    io.to(roomId).emit("whiteboard_cleared", fileId);
  });

  // 🔥 TYPING
  socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("user_typing", username);
  });

  socket.on("stop_typing", ({ roomId }) => {
    socket.to(roomId).emit("user_stop_typing");
  });

  // 🔥 AI CHAT (IMPROVED)
  socket.on("ask_ai", async ({ roomId, prompt }) => {
    if (typeof prompt !== "string" || prompt.length > 100000) {
      socket.emit("ai_response", "Prompt too long or invalid.");
      return;
    }
    try {
      const reply = await askAI(prompt);

      // ✅ Send to all users in room
      io.to(roomId).emit("ai_response", reply);

    } catch (err) {
      socket.emit("ai_response", "AI error");
    }
  });

  // 🔥 DISCONNECT
  socket.on("disconnect", () => {
    const { roomId, username } = socket;

    if (roomId && rooms[roomId]) {
      removeUserFromRoom(roomId, socket.id);
    }

    console.log("User disconnected:", socket.id, username || "");
  });
});

// 🔥 BACKGROUND DB SYNC
setInterval(async () => {
  if (!process.env.MONGODB_URI) return;
  
  const activeRoomIds = Object.keys(rooms);
  if (activeRoomIds.length === 0) return;

  try {
    const bulkOps = activeRoomIds.map(roomId => {
      const room = rooms[roomId];
      return {
        updateOne: {
          filter: { roomId },
          update: {
            $set: {
              adminId: room.adminId,
              isLocked: room.isLocked,
              isReadOnly: room.isReadOnly,
              isChatMuted: room.isChatMuted,
              files: room.files,
              messages: room.messages
            }
          },
          upsert: true
        }
      };
    });

    await Room.bulkWrite(bulkOps);
  } catch (err) {
    console.error("Error during background sync:", err);
  }
}, 5000); // Sync every 5 seconds

server.listen(process.env.PORT || 5001, () => {
  console.log(\`Server running on port \${process.env.PORT || 5001}\`);
});
