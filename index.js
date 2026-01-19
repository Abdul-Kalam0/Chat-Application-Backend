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
// const CLIENT = "http://localhost:3000"; // change to vercel later

const app = express();
app.use(cors({ origin: CLIENT }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT },
});

// -------- ROUTES --------
app.use("/auth", authRoutes);

// -------- SOCKET.IO --------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔑 join personal room
  socket.on("join", (username) => {
    socket.join(username);
    console.log(`${username} joined their room`);
  });

  // 🔒 PRIVATE MESSAGE
  socket.on("send_message", async ({ sender, receiver, message }) => {
    if (!sender || !receiver || !message) return;

    const savedMessage = await MessageModel.create({
      sender,
      receiver,
      message,
    });

    // send ONLY to sender & receiver
    io.to(sender).emit("receive_message", savedMessage);
    io.to(receiver).emit("receive_message", savedMessage);
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
