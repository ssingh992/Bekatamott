import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

/* ---------------------------------------------
   Helper: create JWT token
---------------------------------------------- */
function createToken(user: any) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
}

/* ---------------------------------------------
   POST /api/auth/register
---------------------------------------------- */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        fullName,
        email,
        username: email.split("@")[0],
        role: "user",
        // Store hashed password in new field
        // Must add password column in schema if missing
        password: hashed as any,
      },
    });

    const token = createToken(user);
    res.json({ token, user });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

/* ---------------------------------------------
   POST /api/auth/login
---------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Missing email or password" });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password)
      return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password as any);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = createToken(user);

    console.log("LOGIN → token generated:", token.substring(0, 30) + "...");

    res.json({ token, user });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

/* ---------------------------------------------
   GET /api/auth/me  (protected)
---------------------------------------------- */
router.get("/me", authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    res.json({ user });
  } catch (error) {
    console.error("ME ERROR:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
