const mongoose = require("mongoose");
const { Schema } = mongoose;

const PostSchema = new mongoose.Schema({
  post_id: {
    type: String,
    unique: true,
    required: true, // Generate a unique post_id if none is provided
  },
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
    //comments: [{ type: string, ref: 'Comment' }],
    comments: [
      {
        content: String,
        replies: [
          {
            content: String,
          },
        ],
      },
    ],
    draft: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
  });
  module.exports = mongoose.model('posts', PostSchema);