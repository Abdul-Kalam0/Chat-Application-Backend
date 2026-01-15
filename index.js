import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

import { Server } from "socket.io";
import http from "http";
import authRoutes from "./routes/authRoutes.js";
import MessageModel from "./models/Message.js";

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

app.use("/", authRoutes);

app.use("/", authRoutes);

export default server;
