import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserProfile
} from "../db/index.js";
import { verifyToken } from "../middleware/auth.js";

dotenv.config();

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await createUser(email, hash, name);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        onboarding_done: user.onboarding_done,
        target_date: user.target_date
      }
    });
  } catch (error) {
    console.error("Register failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        goal: user.goal,
        activity_level: user.activity_level,
        workout_location: user.workout_location,
        equipment: user.equipment,
        role: user.role,
        onboarding_done: user.onboarding_done,
        target_date: user.target_date
      }
    });
  } catch (error) {
    console.error("Login failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user });
  } catch (error) {
    console.error("Fetch profile failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const body = req.body || {};
    const updatedUser = await updateUserProfile(req.userId, body);
    return res.json({ user: updatedUser });
  } catch (error) {
    console.error("Update profile failed", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
