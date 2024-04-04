import express from "express";
import { userRegistration, activateUser } from "../controllers/user.controller";

const userRouter = express.Router();

userRouter.route("/registration").post(userRegistration);
userRouter.route("/activate-user").post(activateUser);

export default userRouter;
