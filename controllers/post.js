const Post = require("../models/Post");
const { errorHandler } = require("../auth");

// Create post (auth required)
exports.addPost = async (req, res) => {
  try {
    const { title, blog } = req.body;
    if (!title?.trim() || !blog?.trim()) {
      return res.status(400).json({ message: "Title and blog are required" });
    }
    const post = await Post.create({
      title: title.trim(),
      blog: blog.trim(),
      userId: req.user.id
    });
    res.status(201).json(post);
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// List posts (public). Returns [] if none.
exports.getAllPosts = async (_req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(posts);
  } catch (err) {
    errorHandler(err, _req, res);
  }
};

// Get single post (public)
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).lean();
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// Add comment (auth required)
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment?.trim()) {
      return res.status(400).json({ message: "Comment is required" });
    }
    const updated = await Post.findByIdAndUpdate(
      req.params.postId,
      { $push: { comments: { userId: req.user.id, comment: comment.trim() } } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(updated);
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// Delete post (ADMIN only)
exports.deletePost = async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.postId);
    if (!deleted) return res.status(404).json({ message: "Post not found" });
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    errorHandler(err, req, res);
  }
};

// Remove comment (ADMIN only)
exports.removeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const updated = await Post.findOneAndUpdate(
      { _id: postId, "comments._id": commentId },
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Post or comment not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    errorHandler(err, req, res);
  }
};
