import express from "express";
import { login, register } from "../controllers/authControllers.js";
const router = express.Router();

//register routes
router.post("/register", register);

//login routes
router.post("/login", login);

export default router;
