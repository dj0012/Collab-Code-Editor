const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  language: { type: String, required: true },
  content: { type: String, default: "" },
});

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  files: [fileSchema],
});

module.exports = mongoose.model('Template', templateSchema);
