import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { testAuth } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/test", authMiddleware, testAuth);

export default router;
