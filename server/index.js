const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { askAI } = require("./ai");
const mongoose = require("mongoose");
const Room = require("./models/Room");
const User = require("./models/User");
const Template = require("./models/Template");
const Version = require("./models/Version");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
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
app.use(express.json());

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) return res.status(400).json({ error: "MongoDB not configured" });
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: "Username already taken" });
    
    const user = new User({ username, password });
    await user.save();
    
    const token = jwt.sign({ userId: user._id.toString(), username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username, userId: user._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) return res.status(400).json({ error: "MongoDB not configured" });
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    
    const token = jwt.sign({ userId: user._id.toString(), username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username, userId: user._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/user/rooms", async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) return res.json([]);
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userRooms = await Room.find({ adminId: decoded.userId }).sort({ updatedAt: -1 }).select('roomId updatedAt');
    res.json(userRooms);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/api/templates", async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) {
      // Fallback templates if no DB
      return res.json([
        { _id: "1", name: "Blank", description: "Start from scratch", files: [] },
        { _id: "2", name: "React App", description: "Basic React component", files: [{ id: "1", name: "App.jsx", language: "javascript", content: "export default function App() {\n  return <h1>Hello React</h1>;\n}" }] },
        { _id: "3", name: "HTML/CSS", description: "Basic web page", files: [{ id: "1", name: "index.html", language: "html", content: "<h1>Hello World</h1>" }] }
      ]);
    }
    const templates = await Template.find({});
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/versions/:roomId", async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) return res.json([]);
    const versions = await Version.find({ roomId: req.params.roomId }).sort({ createdAt: -1 });
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/versions", async (req, res) => {
  try {
    if (!process.env.MONGODB_URI) return res.json({ success: true });
    const { roomId, name, savedBy, files } = req.body;
    const version = new Version({ roomId, name, savedBy, files });
    await version.save();
    
    // Broadcast to room that a new version was saved
    io.to(roomId).emit("version_saved", version);
    res.json(version);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

const seedTemplates = async () => {
  try {
    if (!process.env.MONGODB_URI) return;
    const count = await Template.countDocuments();
    if (count === 0) {
      await Template.insertMany([
        { name: "Blank Project", description: "Start from scratch", files: [] },
        { name: "React Boilerplate", description: "Simple React component", files: [
            { id: "1", name: "App.jsx", language: "javascript", content: "import React from 'react';\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Hello React</h1>\n    </div>\n  );\n}" }
          ]
        },
        { name: "Web Basics", description: "HTML and CSS starter", files: [
            { id: "1", name: "index.html", language: "html", content: "<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>" },
            { id: "2", name: "style.css", language: "css", content: "body {\n  font-family: sans-serif;\n}" }
          ]
        }
      ]);
      console.log("Templates seeded.");
    }
  } catch (err) {
    console.error("Error seeding templates:", err);
  }
};
if (process.env.MONGODB_URI) {
  seedTemplates();
}

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

  const adminUser = room.users.find((user) => user.userId === room.adminId);

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

  // Admin transfer disabled: creator is permanent admin

  if (room.users.length === 0) {
    // Room is empty, but we keep it in memory so data isn't lost on quick refresh
    return;
  }

  emitRoomState(roomId);
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔥 JOIN ROOM
  socket.on("join_room", async ({ roomId, username, avatar, userId, initialFiles }) => {
    socket.join(roomId);

    socket.username = username;
    socket.roomId = roomId;
    socket.userId = userId;

    if (!rooms[roomId]) {
      let dbRoom = null;
      if (process.env.MONGODB_URI) {
        try {
          dbRoom = await Room.findOne({ roomId });
        } catch (err) {
          console.error("Error fetching room from DB:", err);
        }
      }

      // Check again to avoid async race condition when multiple users join simultaneously
      if (!rooms[roomId]) {
        if (dbRoom) {
          rooms[roomId] = {
            adminId: dbRoom.adminId || userId,
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
            adminId: userId,
            users: [],
            files: initialFiles || [],
            whiteboard: [],
            messages: [],
            isLocked: false,
            isReadOnly: false,
            isChatMuted: false,
          };
        }
      }
    }

    const room = rooms[roomId];
    const alreadyJoined = room.users.some((user) => user.socketId === socket.id);

    if (room.isLocked && !alreadyJoined) {
      socket.emit("join_rejected", { reason: "Room is locked by the admin." });
      return;
    }

    if (!alreadyJoined) {
      room.users.push({ socketId: socket.id, userId, username, avatar: avatar || null, canEdit: false });
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
      if (room.isReadOnly && room.adminId !== socket.userId && (!user || !user.canEdit)) return; // ENFORCE READ-ONLY
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
    if (room && room.adminId === socket.userId) {
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
    if (room && room.adminId === socket.userId) {
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
    if (!room || room.adminId !== socket.userId) return;
    const file = room.files.find(f => f.id === fileId);
    if (file) {
      file.language = language;
      io.to(roomId).emit("language_updated", { fileId, language });
    }
  });

  socket.on("reset_code", ({ roomId, fileId }) => {
    const room = rooms[roomId];

    if (!room || room.adminId !== socket.userId) return;

    const file = room.files.find(f => f.id === fileId);
    if (file) {
      file.content = "";
      io.to(roomId).emit("file_update", { fileId, content: "" });
    }
  });

  socket.on("assign_admin", ({ roomId, newAdminId }) => {
    const room = rooms[roomId];
    if (!room || room.adminId !== socket.userId) return; // Only current admin can reassign

    // Verify the new admin is actually in the room
    const userExists = room.users.some(user => user.userId === newAdminId);
    if (userExists) {
      room.adminId = newAdminId;
      emitRoomState(roomId);
    }
  });

  socket.on("kick_user", ({ roomId, targetSocketId }) => {
    const room = rooms[roomId];

    if (!room || room.adminId !== socket.userId || targetSocketId === socket.id) return;

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
    if (room && room.adminId === socket.userId) {
      room.isLocked = isLocked;
      emitRoomState(roomId);
    }
  });

  socket.on("force_sync_tab", ({ roomId, fileId }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.userId) {
      socket.to(roomId).emit("force_tab_switch", fileId);
    }
  });

  socket.on("global_announcement", ({ roomId, message }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.userId) {
      io.to(roomId).emit("receive_announcement", { message, sender: room.users.find(u => u.socketId === socket.id)?.username || 'Admin' });
    }
  });

  socket.on("toggle_read_only", ({ roomId, isReadOnly }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.userId) {
      room.isReadOnly = isReadOnly;
      emitRoomState(roomId);
    }
  });

  socket.on("toggle_chat_mute", ({ roomId, isChatMuted }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.userId) {
      room.isChatMuted = isChatMuted;
      emitRoomState(roomId);
    }
  });

  socket.on("kick_all_users", ({ roomId }) => {
    const room = rooms[roomId];
    if (room && room.adminId === socket.userId) {
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
    if (room && room.adminId === socket.userId) {
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
    if (room.isChatMuted && room.adminId !== socket.userId && (!user || !user.canEdit)) return; // ENFORCE CHAT MUTE
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
  console.log(`Server running on port ${process.env.PORT || 5001}`);
});
