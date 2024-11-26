const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const appError = require("../utils/appError");

const path = require("path");
const multer = require("multer");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/profiles");
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
  .route("/register")
  .get(authController.getRegisterPage)
  .post(upload.single("avatar"), authController.register);

router
  .route("/register/check-verification")
  .get(authController.getRegisterCheckVerification);

router.route("/register/verify").get(authController.verifyUser);

router
  .route("/login")
  .get(authController.getLoginPage)
  .post(authController.login);

router
  .route("/login/confirm-email")
  .get(authController.getConfirmEmailPage)
  .post(authController.confirmEmail);

router
  .route("/login/check-verify-reset-password")
  .get(authController.getCheckVerifyResetPasswordPage);

router
  .route("/login/reset-password")
  .get(authController.getResetPasswordPage)
  .post(authController.forgetPassword);

router.route("/logout").get(authController.logout);

module.exports = router;
