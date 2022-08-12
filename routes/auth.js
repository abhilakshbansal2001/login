const express = require("express");
const router = express.Router();

// Controllers
const {
  login,
  register,
  forgotPassword,
  resetPassword,
  activation,
  googleController
} = require("../controllers/auth");

router.route("/register").post(register);

router.route("/login").post(login);

router.route("/forgotpassword").post(forgotPassword);

router.route("/passwordreset").put(resetPassword);

router.route("/activation").put(activation);

router.route("/googlelogin").post(googleController);

module.exports = router;
