import jwt from "jsonwebtoken";
import { Router } from "express";
import bcryptjs from "bcryptjs";
import { isMongoConnected } from "../config/db.js";
import User from "../models/User.js";

const router = Router();

// In-memory user store (for development without MongoDB)
const memoryUsers = new Map();

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
}

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Register endpoint
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    if (isMongoConnected()) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const user = new User({ email, password, name });
      await user.save();

      const token = generateToken(user._id.toString());
      return res.status(201).json({
        token,
        user: user.toPublicJSON()
      });
    } else {
      // In-memory fallback
      if (memoryUsers.has(email)) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcryptjs.hash(password, 10);
      const userId = `user_${Date.now()}`;
      const user = {
        id: userId,
        email,
        name,
        role: "user",
        preferences: {
          theme: "auto",
          emailNotifications: true,
          defaultTask: "fake_news"
        },
        stats: {
          totalPredictions: 0,
          totalBatchRows: 0,
          averageAccuracy: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      memoryUsers.set(email, { ...user, password: hashedPassword });

      const token = generateToken(userId);
      return res.status(201).json({
        token,
        user
      });
    }
  } catch (error) {
    next(error);
  }
});

// Login endpoint
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (isMongoConnected()) {
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id.toString());
      return res.json({
        token,
        user: user.toPublicJSON()
      });
    } else {
      // In-memory fallback
      const user = memoryUsers.get(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const passwordMatch = await bcryptjs.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      const { password: _, ...publicUser } = user;
      return res.json({
        token,
        user: publicUser
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json({ user: user.toPublicJSON() });
    } else {
      // In-memory fallback - find user by ID
      let foundUser = null;
      for (const user of memoryUsers.values()) {
        if (user.id === req.user.userId) {
          foundUser = user;
          break;
        }
      }
      if (!foundUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...publicUser } = foundUser;
      return res.json({ user: publicUser });
    }
  } catch (error) {
    next(error);
  }
});

// Update user preferences
router.patch("/preferences", authMiddleware, async (req, res, next) => {
  try {
    const { preferences } = req.body;

    if (isMongoConnected()) {
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { preferences },
        { new: true }
      );
      return res.json({ user: user.toPublicJSON() });
    } else {
      // In-memory fallback
      let foundUser = null;
      for (const [email, user] of memoryUsers.entries()) {
        if (user.id === req.user.userId) {
          foundUser = user;
          user.preferences = preferences;
          user.updatedAt = new Date().toISOString();
          memoryUsers.set(email, user);
          break;
        }
      }
      if (!foundUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...publicUser } = foundUser;
      return res.json({ user: publicUser });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
