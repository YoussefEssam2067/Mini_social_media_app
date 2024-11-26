const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const authMiddleware = require("../middlewares/authMiddleware");

const path = require("path");
const multer = require("multer");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/comments");
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const fileName = `user-${Date.now()}.${ext}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  const imageType = file.mimetype.split("/")[0];

  if (imageType === "image") {
    return cb(null, true);
  } else {
    return cb(appError.create("file must be an image", 400), false);
  }
};

const upload = multer({ storage: diskStorage, fileFilter });

router
  .route("/posts/:id/comments")
  .post(authMiddleware, upload.array("images"), commentController.addComment);

router
  .route("/posts/:postId/comments/:commentId/delete")
  .post(authMiddleware, commentController.deleteComment);

router
  .route("/posts/:postId/comments/:commentId/edit")
  .get(authMiddleware, commentController.getEditCommentPage);

router
  .route("/posts/:postId/comments/:commentId/edit-comment")
  .post(
    authMiddleware,
    upload.array("images"),
    commentController.updateComment
  );

module.exports = router;
