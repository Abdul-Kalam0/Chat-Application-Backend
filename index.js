import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import UserModel from "./models/User.js";
import MessageModel from "./models/Message.js";
import authMiddleware from "./middleware/auth.js";

// const CLIENT = "https://chat-application-001.vercel.app";
const CLIENT = "http://localhost:3000";

const app = express();
app.use(
  cors({
    origin: CLIENT,
    credentials: true,
  })
);
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT,
    credentials: true,
  },
});

// Routes
app.use("/auth", authRoutes);

// ================= SOCKET.IO =================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (username) => {
    socket.join(username);
    console.log(username, "joined room");
  });

  socket.on("send_message", async (data) => {
    try {
      const { sender, receiver, message } = data;
      if (!sender || !receiver || !message) return;

      const savedMessage = await MessageModel.create({
        sender,
        receiver,
        message,
      });

      // send message to both users
      io.to(sender).emit("receive_message", savedMessage);
      io.to(receiver).emit("receive_message", savedMessage);
    } catch (err) {
      console.error("Socket message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ================= REST APIs =================
app.get("/users", async (req, res) => {
  const { currentUser } = req.query;
  try {
    const users = await UserModel.find({
      username: { $ne: currentUser },
    }).select("_id username");

    res.json(users);
  } catch (error) {
    res.status(500).json([]);
  }
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

    res.json(messages);
  } catch (error) {
    res.status(500).json([]);
  }
});

export default server;
