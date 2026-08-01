import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import prisma from "./config/prisma.js";
import profileRoutes from "./routes/profile.routes.js";



const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(errorHandler);
app.use("/api/profiles", profileRoutes);

// Health Check Route
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Backend is running",
      database: "Connected"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: "Disconnected"
    });
  }
});

export default app;