import { Request, Response, NextFunction } from "express";
import { ApiErrors } from "../utils/ApiErrors";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { userModel, User } from "../models/user.model";
import Jwt, { Secret } from "jsonwebtoken";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";

/*USER REGISTRATION STEP 1 - SEND VERIFICATION CODE */
interface IRegistrationBody {
  userName: string;
  email: string;
  password: string;
}

export const userRegistration = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userName, email, password } = req.body;

      const doesEmailExist = await userModel.findOne({ email });
      if (doesEmailExist) {
        return new ApiErrors(400, "Email already exist");
      }

      const user: IRegistrationBody = {
        userName,
        email,
        password,
      };
      console.log(user);

      const activationToken = createActivationToken(user);
      //   console.log(activationToken);

      const activationCode = activationToken.activationCode;

      const data = { user: { userName: user.userName }, activationCode };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activationMail.ejs"),
        data
      );

      try {
        await sendMail({
          email: user.email,
          subject: "Activate Your Account",
          template: "activationMail.ejs",
          data,
        });

        return res
          .status(201)
          .json(
            new ApiResponse(
              201,
              { activationToken: activationToken.token },
              `Please check your email ${user.email} to activate your account`
            )
          );
      } catch (error) {
        return next(
          new ApiErrors(
            401,
            " Something went wrong while sending Verification code"
          )
        );
      }
    } catch (error) {
      return next(
        new ApiErrors(401, " Something went wrong while Registration")
      );
    }
  }
);

/* GENERATE ACTIVATION CODE */
interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = Jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

/*USER REGISTRATION STEP 2 - ACTIVATE USER ACCOUNT */
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: any; activationCode: String } = Jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: User; activationCode: String };
      console.log("reached 1");

      if (newUser.activationCode !== activation_code) {
        return next(new ApiErrors(400, "Invalid Activation Code"));
      }
      console.log("reached 2");

      const { userName, email, password } = newUser.user;
      console.log(newUser.user);

      const user = await userModel.create({
        userName,
        email,
        password,
      });

      console.log("reached 3");

      const newUserCreated = await userModel
        .findById(user._id)
        .select("-password");

      if (!newUserCreated) {
        throw new ApiErrors(
          500,
          "Something went wrong while creating and entering the user to DB"
        );
      }

      return res
        .status(201)
        .json(
          new ApiResponse(201, newUserCreated, "User Registration Success..!!")
        );
    } catch (error) {
      return next(
        new ApiErrors(401, " Something went wrong while Verifing the code")
      );
    }
  }
);
