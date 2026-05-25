import "dotenv/config";
import connectToDB from "./db/index.js";
import { app } from "./app.js";
import userRouter from "./routers/user.route.js";

app.use("/api/v1/users", userRouter);

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
