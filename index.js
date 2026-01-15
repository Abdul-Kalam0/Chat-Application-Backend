import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

import { Server } from "socket.io";
import http from "http";
import authRoutes from "./routes/authRoutes.js";
import MessageModel from "./models/Message.js";
import UserModel from "./models/User.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

//express middlewares
app.use(cors());
app.use(express.json());

//auth middleware
app.use("/auth", authRoutes);

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("send_message", async (data) => {
    const { sender, receiver, message } = data;
    const newMessage = new MessageModel({
      sender,
      receiver,
      message,
    });
    await newMessage.save();

    socket.broadcast.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

app.get("/messages", async (req, res) => {
  const { sender, receiver } = req.query;
  try {
    const messages = await MessageModel.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Message Error: ", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

app.get("/users", async (req, res) => {
  const { currentUser } = req.query;
  try {
    const users = await UserModel.find({ username: { $ne: currentUser } });
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not available",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Users Error: ", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
});

export default server;
