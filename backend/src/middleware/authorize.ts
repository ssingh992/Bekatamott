import { Request, Response, NextFunction } from "express";
import prisma from "../db";

export const authorizeAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return res.status(403).json({ error: "Admin privileges required" });
  }

  next();
};

export const authorizeOwner = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== "owner") {
    return res.status(403).json({ error: "Owner privileges required" });
  }

  next();
};
