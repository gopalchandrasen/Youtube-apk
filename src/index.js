import dotenv from "dotenv";
import connectToDB from "./db/index.js";
import { app } from "./app.js";
import userRouter from "./routers/user.route.js";
dotenv.config({ path: "./.env" });

connectToDB()
  .then(() => {
    console.log("Database connection established successfully.");
    app.listen(process.env.PORT, () => {
      console.log(
        `Server is running on port http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });

app.use("/api/v1/users", userRouter);
