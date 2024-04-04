import express from "express";
import {
  userRegistration,
  activateUser,
  userLogin,
  logoutUser,
} from "../controllers/user.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const userRouter = express.Router();

userRouter.route("/registration").post(userRegistration);
userRouter.route("/activate-user").post(activateUser);
userRouter.route("/login-user").post(userLogin);
userRouter.route("/logout-user").post(verifyJWT, logoutUser);

export default userRouter;
