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
        return next(new ApiErrors(400, "Email already exist"));
      }
      const doesUserNameExist = await userModel.findOne({ userName });
      if (doesUserNameExist) {
        return next(new ApiErrors(400, "Username already exist"));
      }

      const user: IRegistrationBody = {
        userName,
        email,
        password,
      };

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

      const { userName, email, password } = newUser.user;
      console.log(newUser.user);

      const user = await userModel.create({
        userName,
        email,
        password,
      });

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

/* GENERATE ACCESS AND REFRESH TOKEN */
interface ITokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const generateAccessRefreshToken = async (
  userId: string
): Promise<ITokenResponse> => {
  try {
    const user: User | null = await userModel.findById(userId);
    if (!user) {
      throw new ApiErrors(404, "User not found");
    }

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error: any) {
    throw new ApiErrors(
      500,
      "Something went wrong while creating access and refresh tokens"
    );
  }
};

/*USER LOGIN */
interface ILoginRequest {
  email: string;
  password: string;
}

export const userLogin = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return new ApiErrors(401, "Email and Password are required");
      }

      /* find the user */
      const user = await userModel.findOne({ email });

      /* if not found */
      if (!user) {
        throw new ApiErrors(404, "User does not exist..!");
      }

      // password check
      const isPasswordValid = await user.isPasswordCorrect(password);

      if (!isPasswordValid) {
        throw new ApiErrors(401, "Incorrect Password.");
      }

      // generate access and refresh token
      const { accessToken, refreshToken } = await generateAccessRefreshToken(
        user._id
      );

      const loggedInUser = await userModel
        .findById(user._id)
        .select("-password -refreshToken");

      // send cookies
      const options = {
        httpOnly: true,
        secure: true,
      };

      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "user Loggedin successfuly"
          )
        );
    } catch (error) {
      return new ApiErrors(401, "Login failed..!");
    }
  }
);

/*USER LOGOUT */
export const logoutUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    console.log(userId.toString());

    try {
      await userModel.findByIdAndUpdate(
        userId,
        {
          $unset: { refreshToken: 1 },
        },
        { new: true }
      );

      const options = {
        httpOnly: true,
        secure: true,
      };

      res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Loggedout"));
    } catch (error: any) {
      next(new ApiErrors(400, "Error while logging out"));
    }
  }
);
