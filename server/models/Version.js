const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  name: { type: String, required: true },
  savedBy: { type: String, required: true },
  files: { type: Array, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Version', versionSchema);
