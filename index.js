import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

import { Server } from "socket.io";
import http from "http";
import authRoutes from "./routes/authRoutes.js";
import UserModel from "./models/User.js";
import MessageModel from "./models/Message.js";

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

//express middlewares
app.use(cors());
app.use(express.json());

//auth middleware
app.use("/auth", authRoutes);

io.on("connection", (socket) => {
  // console.log("User connected", socket.id);

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

// app.get("/users", async (req, res) => {
//   const { currentUser } = req.query;
//   try {
//     // if (!currentUser) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "currentUser is required.",
//     //   });
//     // }

//     const users = await UserModel.find({
//       username: { $ne: currentUser.toLowerCase() },
//     }).select("_id username createdAt");

//     if (users.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "User not available",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Users fetched successfully",
//       users,
//     });
//   } catch (error) {
//     console.log("Users Error: ", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong. Please try again later.",
//       error: error.message,
//     });
//   }
// });

app.get("/users", async (req, res) => {
  const { currentUser } = req.query;
  try {
    const users = await UserModel.find({ username: { $ne: currentUser } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Errro fetching users" });
  }
});

// app.get("/messages", async (req, res) => {
//   const { sender, receiver } = req.query;
//   try {
//     // if (!sender || !receiver) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "sender and receiver is required",
//     //   });
//     // }
//     const messages = await MessageModel.find({
//       $or: [
//         { sender, receiver },
//         { sender: receiver, receiver: sender },
//       ],
//     }).sort({ createdAt: 1 });

//     return res.status(200).json({
//       success: true,
//       messages,
//     });
//   } catch (error) {
//     console.error("Message Error: ", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong. Please try again later.",
//       error: error.message,
//     });
//   }
// });

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
    res.status(500).json({ message: "Error fetching messages" });
  }
});

export default server;
