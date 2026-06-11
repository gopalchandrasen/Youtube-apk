import express from "express";
const router = express.Router();
import {
  registerUser,
  loginUser,
  logoutUser,
  profileUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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
export default router;
