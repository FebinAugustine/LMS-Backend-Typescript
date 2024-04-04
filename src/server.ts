import { app } from "./app";
import "dotenv/config";
import connectDB from "./db/db";

const port = process.env.PORT || 3500;

app.listen(port, () => {
  console.log(`server runnning on port ${port}`);
  connectDB();
});
