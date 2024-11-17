const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  banner: { type: String },
  tags: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: {
    total_likes: { type: Number, default: 0 },
    total_dislikes: { type: Number, default: 0 },
    total_reads: { type: Number, default: 0 },
  },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  draft: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Blog', BlogSchema);