const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const authMiddleware = require("../middlewares/authMiddleware");

const path = require("path");
const multer = require("multer");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/posts");
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

router.get("/posts", authMiddleware, postController.getAllPosts);

router
  .route("/posts/new")
  .get(authMiddleware, postController.getAddNewPostPage)
  .post(authMiddleware, upload.array("images"), postController.createPost);

router.route("/posts/:id").get(authMiddleware, postController.getPost);

router
  .route("/posts/:id/delete")
  .post(authMiddleware, postController.deletePost);

router
  .route("/posts/:id/edit")
  .get(authMiddleware, postController.getEditPostPage);

router
  .route("/posts/:id/edit-post")
  .post(authMiddleware, upload.array("images"), postController.updatePost);

module.exports = router;
