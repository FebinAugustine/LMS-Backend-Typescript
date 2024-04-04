import mongoose, { Schema, Document, Model } from "mongoose";
import Jwt, { Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";

// Interface for user document
export interface User extends Document {
  userName: string;
  email: string;
  password: string;
  role: string;
  refreshToken?: string; // Optional property

  isPasswordCorrect(password: string): Promise<boolean>;
  createAccessToken(): string;
  createRefreshToken(): string;
}

const userSchema: Schema<User> = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    role: {
      type: String,
      default: "user",
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<User>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (
  this: User,
  password: string
) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.createAccessToken = function (this: User) {
  return Jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
    },
    process.env.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.createRefreshToken = function (this: User) {
  return Jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const userModel: Model<User> = mongoose.model("User", userSchema);
export { userModel };
