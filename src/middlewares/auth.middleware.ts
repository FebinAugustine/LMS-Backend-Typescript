import { Request, Response, NextFunction } from "express";
import Jwt, { JwtPayload } from "jsonwebtoken";
import { ApiErrors } from "../utils/ApiErrors";
import { asyncHandler } from "../utils/asyncHandler";
import { userModel } from "../models/user.model";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer", "");

      if (!token) {
        throw new ApiErrors(401, "unauthorized request");
      }

      const decodedToken = Jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as JwtPayload;

      if (!decodedToken) {
        return next(new ApiErrors(400, "Invalid Access Token"));
      }

      const user: any = new mongoose.Types.ObjectId(decodedToken._id);

      req.user = user;
      next();
    } catch (error) {
      return next(new ApiErrors(400, "Unable to verify"));
    }
  }
);
