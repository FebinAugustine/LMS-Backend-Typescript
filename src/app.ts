import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
  })
);
app.use(express.json({}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

/* Routes Import */
import userRouter from "./routes/user.routes";

/* Routes Declaration */
app.use("/api/v1/users", userRouter);

app.get("/home", (req, res, next) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
  next();
});

app.all("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "views", "404.html"));
});

export { app };
