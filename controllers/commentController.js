const asyncWrapper = require("../middlewares/asyncWrapper");
const { Post, Comment } = require("../models");
const path = require("path");
const fs = require("fs");

const addComment = asyncWrapper(async (req, res) => {
  const { content } = req.body;

  // Extract filenames from uploaded files
  const imageFiles = req.files?.map((file) => file.filename) || [];

  // Construct the comment object with or without the image
  const commentData = {
    content,
    userId: req.session.userId,
    postId: req.params.id,
    images: imageFiles,
  };

  // Create the post in the database
  await Comment.create(commentData);

  res.redirect(`/posts/${req.params.id}`);
});

const deleteComment = asyncWrapper(async (req, res) => {
  const comment = await Comment.findByPk(req.params.commentId);

  if (comment.images) {
    const oldImages = comment.images || "[]";
    oldImages.forEach((image) => {
      const imagePath = path.join(__dirname, "../uploads/comments", image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to delete image:", err);
      });
    });
  }

  await comment.destroy();
  res.redirect(`/posts/${req.params.postId}`);
});

const getEditCommentPage = asyncWrapper(async (req, res) => {
  const comment = await Comment.findByPk(req.params.commentId);
  const post = await Post.findByPk(req.params.postId);

  if (!comment || !post) return res.status(404).send("Comment not found");
  if (comment.userId !== req.session.userId)
    return res.status(403).send("Unauthorized");

  res.render("post/edit-comment", {
    title: "Edit Comment",
    userName: req.session.userName,
    post,
    comment,
  });
});

const updateComment = asyncWrapper(async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findByPk(req.params.commentId);
  if (!comment) return res.status(404).send("Comment not found");
  if (comment.userId !== req.session.userId)
    return res.status(403).send("Unauthorized");

  // Delete old images if new images are uploaded
  if (req.files?.length) {
    const oldImages = comment.images || "[]";
    oldImages.forEach((image) => {
      const imagePath = path.join(__dirname, "../uploads/comments", image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to delete image:", err);
      });
    });

    // Save new images
    const newImages = req.files.map((file) => file.filename);
    await comment.update({ content, images: newImages });
  }

  // Update the post with the new data
  await comment.update({ content });

  res.redirect(`/posts/${req.params.postId}`);
});

module.exports = {
  addComment,
  deleteComment,
  getEditCommentPage,
  updateComment,
};
