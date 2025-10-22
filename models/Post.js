const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    comment: { type: String, required: true, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    publishedAt: { type: Date, default: Date.now },
    blog: { type: String, required: true, trim: true },
    comments: { type: [commentSchema], default: [] }
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
