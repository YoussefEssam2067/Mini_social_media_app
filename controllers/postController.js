const asyncWrapper = require("../middlewares/asyncWrapper");
const { User, Post, Comment } = require("../models");
const path = require("path");
const fs = require("fs");

const getAllPosts = asyncWrapper(async (req, res) => {
  const query = req.query;

  const limit = parseInt(query.limit) || 4;
  const page = parseInt(query.page) || 1;

  const offset = (page - 1) * limit;

  const { count, rows: posts } = await Post.findAndCountAll({
    limit: limit,
    offset: offset,
    include: [{ model: User, attributes: ["name"] }],
  });

  const totalPages = Math.ceil(count / limit);

  res.render("post/index", {
    title: "Timeline",
    userName: req.session.userName,
    posts,
    currentPage: page,
    totalPages,
    limit,
    userId: req.session.userId,
  });
});

const getPost = asyncWrapper(async (req, res) => {
  const post = await Post.findByPk(req.params.id, {
    include: [
      {
        model: User,
        attributes: ["name"], // Include only the 'name' attribute of the User model
      },
    ],
  });

  const comments = await Comment.findAll({
    where: { postId: req.params.id },
    include: [
      {
        model: User,
        attributes: ["name"],
      },
    ],
  });

  req.session.post = post;
  req.session.comments = comments;

  res.render("post/detail", {
    title: post.title,
    userName: req.session.userName,
    post,
    comments,
    userId: req.session.userId,
  });
});

const getAddNewPostPage = asyncWrapper(async (req, res) => {
  res.render("post/new", {
    title: "Add new post",
    userName: req.session.userName,
    errors: "",
    formData: "",
  });
});

const createPost = asyncWrapper(async (req, res) => {
  const { title, content } = req.body;
  const errors = {};

  if (!title) {
    errors.title = "Title is required";
  }

  if (!content) {
    errors.content = "Content is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.render("post/new", {
      title: "Add new post",
      userName: req.session.userName,
      errors,
      formData: { title, content },
    });
  }

  // Extract filenames from uploaded files
  const imageFiles = req.files?.map((file) => file.filename) || [];

  // Construct the post object
  const postData = {
    title,
    content,
    userId: req.session.userId,
    images: imageFiles, // Save as a JSON array in the database
  };

  // Create the post in the database
  await Post.create(postData);

  res.redirect("/posts");
});

const deletePost = asyncWrapper(async (req, res) => {
  const post = await Post.findByPk(req.params.id);

  if (post.images) {
    const oldImages = post.images || "[]";
    oldImages.forEach((image) => {
      const imagePath = path.join(__dirname, "../uploads/posts", image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to delete image:", err);
      });
    });
  }

  await post.destroy();
  res.redirect("/posts");
});

const getEditPostPage = asyncWrapper(async (req, res) => {
  const post = await Post.findByPk(req.params.id);
  if (!post) return res.status(404).send("Post not found");
  if (post.userId !== req.session.userId)
    return res.status(403).send("Unauthorized");

  res.render("post/edit-post", {
    title: "Edit Post",
    userName: req.session.userName,
    post,
  });
});

const updatePost = asyncWrapper(async (req, res) => {
  const { title, content } = req.body;
  const post = await Post.findByPk(req.params.id);

  if (!post) return res.status(404).send("Post not found");
  if (post.userId !== req.session.userId)
    return res.status(403).send("Unauthorized");

  // Delete old images if new images are uploaded
  if (req.files?.length) {
    const oldImages = post.images || "[]";
    oldImages.forEach((image) => {
      const imagePath = path.join(__dirname, "../uploads/posts", image);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Failed to delete image:", err);
      });
    });

    // Save new images
    const newImages = req.files.map((file) => file.filename);
    await post.update({ title, content, images: newImages });
  } else {
    // Update only title and content if no new images
    await post.update({ title, content });
  }

  res.redirect(`/posts/${post.id}`);
});

module.exports = {
  getAllPosts,
  getPost,
  getAddNewPostPage,
  createPost,
  deletePost,
  getEditPostPage,
  updatePost,
};
