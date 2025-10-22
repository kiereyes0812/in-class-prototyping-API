const express = require("express");
const userController = require("../controllers/user");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

// Availability checks
router.post("/check-email", userController.checkEmailExists);
router.post("/check-username", userController.checkUsernameExists);

// Auth
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// Me
router.get("/details", verify, userController.getProfile);
router.put("/update-profile", verify, userController.updateProfile);
router.put("/reset-password", verify, userController.resetPassword);

// Admin
router.put("/admin/update-user", verify, verifyAdmin, userController.updateUserByAdmin);

module.exports = router;
