const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/post");
const { verify, verifyAdmin } = require("../auth");

// Public
router.get("/allPosts", ctrl.getAllPosts);
router.get("/:postId", ctrl.getPost);

// Auth required
router.post("/addPost", verify, ctrl.addPost);
router.post("/:postId/comments", verify, ctrl.addComment);

// Admin only
router.delete("/:postId", verify, verifyAdmin, ctrl.deletePost);
router.delete("/:postId/comments/:commentId", verify, verifyAdmin, ctrl.removeComment);

module.exports = router;
