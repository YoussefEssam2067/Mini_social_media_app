const asyncWrapper = require("../middlewares/asyncWrapper");
const { User, Profile } = require("../models");
const bcrypt = require("bcryptjs");
const emailService = require("../services/emailService");
const { generateVerificationToken } = require("../utils/tokenGenerator");
const { Op } = require("sequelize");
let emailForResetPassword;

const getRegisterPage = asyncWrapper(async (req, res) => {
  res.render("auth/register", { title: "Sign Up", errors: "", formData: "" });
});

const register = asyncWrapper(async (req, res) => {
  const { name, email, password, confirmPassword, address, phone, age } =
    req.body;
  const errors = {};

  // Validate name
  if (!name || name.length < 3) {
    errors.name = "Name must be at least 3 characters long.";
  }

  // Validate email
  if (!email || !email.includes("@")) {
    errors.email = "Please provide a valid email address.";
  } else {
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      errors.email = "This email address is already in use";
    }
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

  // If there are any errors, re-render the form with error messages
  if (Object.keys(errors).length > 0) {
    return res.status(400).render("auth/register", {
      title: "Sign Up",
      errors,
      formData: { name, email, address, phone, age }, // Keep entered form data
    });
  }

  // No errors - proceed to create user
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Generate a verification token
  const verificationToken = generateVerificationToken();

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    address,
    phone,
    age,
    verificationToken,
    isVerified: false, // Set initial verification status as false
  });

  // If a file is uploaded, add the image to the post data
  if (req.file && req.file.filename) {
    await Profile.create({
      userId: newUser.id,
      avatar: req.file.filename,
    });
  } else {
    await Profile.create({
      userId: newUser.id,
      avatar: "default.png",
    });
  }

  // Send verification email
  await emailService.sendVerificationEmail(email, verificationToken);

  return res.redirect("/register/check-verification");
});

const getRegisterCheckVerification = asyncWrapper(async (req, res) => {
  res.render("auth/check-verification", { title: "Check verification" });
});

const verifyUser = asyncWrapper(async (req, res) => {
  const { token } = req.query;

  // Find user with the matching verification token
  const user = await User.findOne({ where: { verificationToken: token } });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid or expired verification token." });
  }

  // Mark user as verified and clear the verification token
  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  res.render("auth/verification-success", { title: "Verification Success" });
});

const getLoginPage = asyncWrapper(async (req, res) => {
  res.render("auth/login", { title: "Log In", errors: "", formData: "" });
});

const login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  // Validate email
  if (!email || !email.includes("@")) {
    errors.email = "Please provide a valid email address.";
  }

  // Validate password
  if (!password || password.length < 6) {
    errors.password = "Password must be at least 6 characters long.";
  }

  // If there are any errors, re-render the form with error messages
  if (Object.keys(errors).length > 0) {
    return res.status(400).render("auth/login", {
      title: "Login",
      errors,
      formData: { email }, // Keep entered form data
    });
  }

  const user = await User.findOne({ where: { email } });

  if (!user || !user.isVerified) {
    errors.email = "Account not found or email not verified!";

    return res.status(400).render("auth/login", {
      title: "Login",
      errors,
      formData: { email }, // Keep entered form data
    });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    errors.password = "Wrong Password, Try Again!";

    return res.status(400).render("auth/login", {
      title: "Login",
      errors,
      formData: { email }, // Keep entered form data
    });
  }

  req.session.userId = user.id;
  req.session.userName = user.name;

  req.session.save((err) => {
    if (err) {
      return next(err); // Handle error
    }
    res.redirect("/posts"); // Redirect after setting session
  });
});

const getConfirmEmailPage = asyncWrapper(async (req, res) => {
  res.render("auth/confirm-email", {
    title: "Confirm Email",
    error: "",
    formData: "",
  });
});

const confirmEmail = asyncWrapper(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  let error;

  if (!user) {
    error = "User not found";

    return res.render("auth/confirm-email", {
      title: "Confirm Email",
      error,
      formData: { email }, // Keep entered form data
    });
  }

  // Generate token and expiration
  const resetToken = generateVerificationToken();
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 3600000; // Token expires in 1 hour
  await user.save();

  await emailService.sendResetPasswordEmail(email, resetToken);

  emailForResetPassword = email;
  return res.redirect("/login/check-verify-reset-password");
});

const getCheckVerifyResetPasswordPage = asyncWrapper(async (req, res) => {
  res.render("auth/check-verify-reset-password", {
    title: "Check verify reset password",
  });
});

const getResetPasswordPage = asyncWrapper(async (req, res) => {
  res.render("auth/reset-password", {
    title: "Reset Password",
    errors: "",
    formData: "",
    token: req.query.token, // Include token if it’s sent in the URL
  });
});

const forgetPassword = asyncWrapper(async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;
  const errors = {};

  if (!newPassword) {
    errors.newPassword = "Password is required";

    return res.render("auth/reset-password", {
      title: "Reset Password",
      errors,
      formData: { newPassword, confirmPassword },
    });
  }

  if (newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";

    return res.render("auth/reset-password", {
      title: "Reset Password",
      errors,
      formData: { newPassword, confirmPassword },
    });
  }

  const user = await User.findOne({
    where: {
      resetToken: token,
      resetTokenExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const newHashedPassword = bcrypt.hashSync(newPassword, 10);

  const updateUser = await User.update(
    { password: newHashedPassword, resetToken: null, resetTokenExpires: null }, // Spread the request body to set new values
    {
      where: {
        email: emailForResetPassword, // Condition to find the User by its ID
      },
    }
  );

  if (updateUser) {
    res.redirect("/login");
  }
});

const logout = asyncWrapper(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.clearCookie("session_id");
    res.redirect("/login");
  });
});

module.exports = {
  getRegisterPage,
  register,
  getRegisterCheckVerification,
  verifyUser,
  getLoginPage,
  login,
  getConfirmEmailPage,
  confirmEmail,
  getCheckVerifyResetPasswordPage,
  getResetPasswordPage,
  forgetPassword,
  logout,
};
