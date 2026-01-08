import server from "./index.js";
import dotenv from "dotenv";
dotenv.config();
import dbInitialization from "./config/db.js";

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await dbInitialization();
    server.listen(PORT, () => {
      console.log("🚀Server is listening on PORT 3000.");
    });
  } catch (error) {
    console.error("❌Error is starting server.", error);
  }
}

start();
