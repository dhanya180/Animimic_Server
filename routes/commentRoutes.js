// const express = require('express');
// const Comment = require('../Schema/comment');
// const Blog = require('../Schema/Forum');
// const router = express.Router();

// // Add a comment to a blog
// router.post('/add', async (req, res) => {
//   const { blogId, userId, content } = req.body;
//   try {
//     const comment = new Comment({ blog: blogId, user: userId, content });
//     const savedComment = await comment.save();

//     await Blog.findByIdAndUpdate(blogId, { $push: { comments: savedComment._id } });
//     res.status(201).json(savedComment);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Reply to a comment
// router.post('/reply', async (req, res) => {
//   const { commentId, userId, content } = req.body;
//   try {
//     const reply = new Comment({ user: userId, content });
//     const savedReply = await reply.save();

//     await Comment.findByIdAndUpdate(commentId, { $push: { replies: savedReply._id } });
//     res.status(201).json(savedReply);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Like a comment
// router.post('/:id/like', async (req, res) => {
//   const { id } = req.params;
//   try {
//     const comment = await Comment.findById(id);
//     comment.likes++;
//     await comment.save();
//     res.status(200).json({ likes: comment.likes });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;


const express = require('express');
const Comment = require('../Schema/comment');
const Post = require('../models/Post');
const router = express.Router();

// Add a comment to a blog
// router.post('/add', async (req, res) => {
//   const { blogId, userId, content } = req.body;
//   try {
//     const comment = new Comment({ blog: blogId, user: userId, content });
//     const savedComment = await comment.save();
//     await Blog.findByIdAndUpdate(blogId, { $push: { comments: savedComment._id } });
//     res.status(201).json(savedComment);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

router.post('/add', async (req, res) => {
  const { postId, userId, content } = req.body;
  try {
    const comment = new Comment({ post: postId, user: userId, content });
    const savedComment = await comment.save();
    await Post.findByIdAndUpdate(postId, { $push: { comments: savedComment._id } });
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Other comment routes...

module.exports = router;
