import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import UserModel from "./models/User.js";
import MessageModel from "./models/Message.js";

const CLIENT = "https://chat-application-001.vercel.app";
// const CLIENT = "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT }));
app.use(express.json());

const server = http.createServer(app);

// 🔒 FORCE WEBSOCKET (critical)
const io = new Server(server, {
  cors: { origin: CLIENT },
  transports: ["websocket"],
});

// -------- ROUTES --------
app.use("/auth", authRoutes);

// -------- SOCKET.IO --------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ join personal room (reliable)
  socket.on("join", (username) => {
    if (!username) return;
    socket.join(username);
    console.log(`${username} joined room`);
  });

  // ✅ PRIVATE 1-to-1 MESSAGE
  socket.on("send_message", async (data, ack) => {
    try {
      const { sender, receiver, message } = data;
      if (!sender || !receiver || !message) return;

      const savedMessage = await MessageModel.create({
        sender,
        receiver,
        message,
      });

      // 🔒 SEND ONLY TO BOTH USERS
      io.to(sender).emit("receive_message", savedMessage);
      io.to(receiver).emit("receive_message", savedMessage);

      ack?.({ success: true });
    } catch (err) {
      console.error(err);
      ack?.({ success: false });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// -------- REST APIs --------
app.get("/users", async (req, res) => {
  const { currentUser } = req.query;
  const users = await UserModel.find({
    username: { $ne: currentUser },
  }).select("_id username");

  res.json(users);
});

app.get("/messages", async (req, res) => {
  const { sender, receiver } = req.query;

  const messages = await MessageModel.find({
    $or: [
      { sender, receiver },
      { sender: receiver, receiver: sender },
    ],
  }).sort({ createdAt: 1 });

  res.json(messages);
});

export default server;
