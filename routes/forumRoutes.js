const mongoose = require('mongoose');
const express = require('express');
const Post = require('../models/Post');
const router = express.Router();
const Comment = require('../models/comment'); // Adjust path based on your file structure


// Fetch all blogs
router.get('/all', async (req, res) => {
  try {
    const posts = await Post.find({ draft: false });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
function generatePostId() {
  return 'post_' + Math.random().toString(36).substring(2, 15);  // Generates a random unique ID
}
router.post('/create', async (req, res) => {
    const { post_id,title, description, content, tags, authorId, draft } = req.body;
    if (!title || !content || !description) {
      return res.status(400).json({ error: 'Title and content  or description are required' });
  }
  let postIdToUse = post_id || generatePostId();
  if (!postIdToUse) {
    return res.status(400).json({ message: 'post_id is required' });
  }
    try {
      const post = new Post({
        post_id:postIdToUse,
       //post_id:new mongoose.Types.ObjectId(),
        title,
        description,
        content,
        tags,
        author: authorId,
        draft,
      });
      const savedPost = await post.save();
      res.status(201).json(savedPost);
    } catch (error) {
      console.error("Error creating post:", error); // Add error logging here
      res.status(500).json({ error: error.message });
    }
  });
  
// Like a blog
router.post('/:id/like', async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.activity.total_likes = (post.activity.total_likes || 0) + 1;;
    post.activity.total_dislikes=0;
    await post.save();

    res.status(200).json({ total_likes: post.activity.total_likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dislike a blog
router.post('/:id/dislike', async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.activity.total_dislikes=(post.activity.total_dislikes || 0) + 1;
    post.activity.total_likes=0;
    await post.save();

    res.status(200).json({ total_dislikes: post.activity.total_dislikes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Fetch a discussion post by ID

router.get('/:id', async (req, res) => {
  try {
    const postId = req.params.id;

    // Populate the comments and their replies
    const post = await Post.findById(postId).populate({
      path: 'comments',
      populate: {
        path: 'replies', // Populate replies inside each comment
        model: 'Comment', // Ensure it uses the 'Comment' model for replies
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// router.get('/:id', async (req, res) => {
//   // const { id } = req.params;

//   // if (!mongoose.Types.ObjectId.isValid(id)) {
//   //   return res.status(400).json({ message: 'Invalid post ID format' });
//   // }

//   try {
//     const post = await Post.findById(id).populate('comments.replies');
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     res.status(200).json(post);
//   } catch (error) {
//     console.error('Error fetching post:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
router.post('/:id/comments/:commentId/reply', async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const { userId,content } = req.body; // The content of the reply

    // Validate content
    if (!content) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    // Find the post by ID
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the comment by ID
    const comment = post.comments.id(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Create the reply object
    const newReply = { content, userId }; // Assuming `req.user.id` holds the logged-in user's ID

    // Push the reply to the comment's replies array
    comment.replies.push(newReply);

    // Save the post with the new reply
    await post.save();

    // Send the updated comment back as the response
    res.status(200).json(comment);
  } catch (error) {
    console.error('Error replying to comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// router.post('/api/posts/:id/comments', async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const newComment = {
//       content: req.body.content,
//       replies: [],
//     };
    
//     post.comments.push(newComment);
//     await post.save();
//     res.status(201).json(newComment);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to add comment' });
//   }
// });
router.post("/:postId/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const newComment = { content: req.body.content, replies: [] };
    post.comments.push(newComment);
    await post.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});
// router.post("/:postId/comments", async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.postId);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     const newComment = {
//       content: req.body.content,
//       replies: [],
//     };

//     // Push the new comment directly into the post's comments array
//     post.comments.push(newComment);
//     await post.save();

//     // Respond with the new comment
//     res.status(201).json(newComment);
//   } catch (error) {
//     console.error("Error adding comment:", error);  // Log the detailed error
//     return res.status(500).json({ error: "Failed to add comment", details: error.message });  // Send detailed error message
//   }
// });


// router.post('/api/posts/:postId/comments/:commentId/reply', async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.postId);
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     const comment = post.comments.id(req.params.commentId);
//     if (!comment) {
//       return res.status(404).json({ message: 'Comment not found' });
//     }

//     const newReply = {
//       content: req.body.content,
//     };

//     comment.replies.push(newReply);
//     await post.save();
//     res.status(201).json(newReply);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to add reply' });
//   }
// });


// 

router.post("/:postId/comments/:commentId/reply", async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content, userId } = req.body;

    // Validate content
    if (!content) {
      return res.status(400).json({ message: 'Reply content is required.' });
    }

    // Find the post and comment
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // Create new reply
    const newReply = { content, authorId: userId };
    comment.replies.push(newReply);
    await post.save();

    res.status(201).json(newReply);
  } catch (error) {
    console.error("Error replying to comment:", error);  // More detailed logging
    res.status(500).json({ message: 'Server error. Failed to add reply.' });
  }
});


// router.post("/:postId/comments/:commentId/reply", async (req, res) => {
//   try {
//     const postId = req.params.postId;
//     const commentId = req.params.commentId;
//     const { content, userId } = req.body;

//     if (!content) {
//       return res.status(400).json({ message: 'Reply content is required.' });
//     }

//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found.' });
//     }

//     // Ensure commentId is treated as an ObjectId for querying
//     const comment = post.comments.id(mongoose.Types.ObjectId(commentId));  // Convert commentId to ObjectId

//     if (!comment) {
//       return res.status(404).json({ message: 'Comment not found.' });
//     }

//     const newReply = { content, authorId: userId };
//     comment.replies.push(newReply);
//     await post.save();
//     res.status(201).json(newReply);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to add reply" });
//   }
// });
module.exports = router;
