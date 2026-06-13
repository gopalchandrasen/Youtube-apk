import express from "express";
const router = express.Router();
import {
  registerUser,
  loginUser,
  logoutUser,
  profileUser,
  refreshAccessToken,
  changeCurrentUserPassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateChangePasswordBody } from "../middlewares/password.middleware.js";

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/profile").post(verifyJWT, profileUser);
router.route("/refresh-token").post(refreshAccessToken);
router
  .route("/change-password")
  .post(verifyJWT, validateChangePasswordBody, changeCurrentUserPassword);
export default router;
