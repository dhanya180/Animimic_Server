// const mongoose = require('mongoose');

// const CommentSchema = new mongoose.Schema({
//   blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   content: { type: String, required: true },
//   likes: { type: Number, default: 0 },
//   dislikes: { type: Number, default: 0 },
//   replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Comment', CommentSchema);

// models/Comment.js
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  // You can add more fields like createdAt, userId, etc.
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  replies: [replySchema], // This embeds replies into each comment
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
