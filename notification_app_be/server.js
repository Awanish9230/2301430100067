import express from "express";
import dotenv from "dotenv/config";
import connectDB from "./config/db.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

connectDB();

const app = express();

app.use(express.json());

app.use("/api/notifications", notificationRoutes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});