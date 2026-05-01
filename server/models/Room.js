const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  id: String,
  name: String,
  content: String,
  language: String,
  whiteboard: { type: mongoose.Schema.Types.Mixed, default: [] }, // Can be array of lines or Excalidraw elements
  executions: { type: Array, default: [] }
});

const messageSchema = new mongoose.Schema({
  id: String,
  message: String,
  username: String,
  createdAt: String
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  adminId: String,       // Storing this is optional but good for context
  isLocked: { type: Boolean, default: false },
  isReadOnly: { type: Boolean, default: false },
  isChatMuted: { type: Boolean, default: false },
  files: [fileSchema],
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
