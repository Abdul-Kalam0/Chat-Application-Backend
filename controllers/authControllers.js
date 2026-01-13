import bcrypt from "bcrypt";
import UserModel from "../models/User.js";

export const register = async (req, res) => {
  try {
    let { username, password } = req.body;

    // 3️⃣ Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and Password are required",
      });
    }

    // 2️⃣ Normalize input
    username = username.trim().toLowerCase();
    password = password.trim();

    // 3️⃣ Strong password rule
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }
    // 4️⃣ Check existing user
    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already taken",
      });
    }
    // 5️⃣ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 6️⃣ Create user
    const user = new UserModel({
      username,
      password: passwordHash,
    });
    await user.save();

    // 7️⃣ Respond
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Register Error: ", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

export const login = async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and Password are required",
      });
    }

    // Normalize username
    username = username.trim().toLowerCase();

    const user = await UserModel.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPassMatch = await bcrypt.compare(password, user.password);
    if (!isPassMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try later.",
    });
  }
};
