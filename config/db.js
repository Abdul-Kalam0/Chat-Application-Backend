import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbInitialization = async () => {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅DB connected successfully"))
    .catch(() => console.error("❌DB is not connected"));
};

export default dbInitialization;
