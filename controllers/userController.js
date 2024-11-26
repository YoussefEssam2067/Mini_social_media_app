const asyncWrapper = require("../middlewares/asyncWrapper");
const { User, Profile, Post } = require("../models");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const currentUser = asyncWrapper(async (req, res) => {
  const user = await User.findByPk(req.session.userId);
  const profile = await Profile.findOne({
    where: {
      userId: req.session.userId,
    },
  });

  return res.render("user/profile", {
    title: "Profile",
    userName: req.session.userName,
    user,
    profile,
  });
});

const getEditProfilePage = asyncWrapper(async (req, res) => {
  const user = await User.findByPk(req.session.userId);

  res.render("user/edit-profile", {
    title: "Edit Profile",
    userName: req.session.userName,
    user,
    errors: "",
    formData: "",
  });
});

const updateUser = asyncWrapper(async (req, res) => {
  const { bio, name, email, password, confirmPassword, address, phone, age } =
    req.body;

  const errors = {};
  const user = await User.findByPk(req.session.userId);

  // Validate name
  if (!name || name.length < 3) {
    errors.name = "Name must be at least 3 characters long.";
  }

  // Validate email
  if (!email || !email.includes("@")) {
    errors.email = "Please provide a valid email address.";
  }

  // Validate password
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  // Check if password and confirm password match
  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  // Validate phone
  if (!phone || phone.length !== 11) {
    errors.phone = "Phone number must be 11 digits long.";
  }

  if (!age || age < 0) {
    errors.age = "Age must be a positive integer.";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).render("user/edit-profile", {
      title: "Edit Profile",
      userName: req.session.userName,
      user,
      errors,
      formData: { bio, name, email, address, phone, age }, // Keep entered form data
    });
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    req.body.password = hashedPassword;
  }

  // Retrieve the existing profile to access the current avatar filename
  const profile = await Profile.findOne({
    where: { userId: req.session.userId },
  });

  // Update the user's information
  await User.update(
    { ...req.body },
    {
      where: {
        id: req.session.userId,
      },
    }
  );

  // Check if a new avatar file was uploaded
  if (req.file) {
    // Delete the old avatar file if it exists and is not the default
    if (profile.avatar && profile.avatar !== "default.png") {
      const oldAvatarPath = path.join(
        __dirname,
        "../uploads/profiles",
        profile.avatar
      );

      fs.unlink(oldAvatarPath, (err) => {
        if (err) {
          console.error("Failed to delete old avatar:", err);
        } else {
          console.log("Old avatar deleted successfully");
        }
      });
    }

    // Update the profile with the new avatar
    // If a file is uploaded, add the image to the post data
    if (req.file && req.file.filename) {
      await Profile.update(
        { avatar: req.file.filename },
        {
          where: { userId: req.session.userId },
        }
      );
    }
  }

  if (bio) {
    await Profile.update(
      { bio },
      {
        where: { userId: req.session.userId },
      }
    );
  }

  req.session.userName = name;
  return res.redirect("/profile");
});

const getPostsPage = asyncWrapper(async (req, res) => {
  const query = req.query;

  const limit = parseInt(query.limit) || 4;
  const page = parseInt(query.page) || 1;

  const offset = (page - 1) * limit;

  const { count, rows: posts } = await Post.findAndCountAll({
    limit: limit,
    offset: offset,
    where: {
      userId: req.session.userId, // Filter posts by userId
    },
    include: [{ model: User, attributes: ["name"] }],
  });

  const totalPages = Math.ceil(count / limit);

  res.render("user/posts", {
    title: "Posts",
    userName: req.session.userName,
    posts,
    currentPage: page,
    totalPages,
    limit,
    userId: req.session.userId,
  });
});

module.exports = {
  currentUser,
  getEditProfilePage,
  updateUser,
  getPostsPage,
};
