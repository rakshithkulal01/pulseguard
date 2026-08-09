import express from "express";
import {
    getReport,
    downloadReport
} from "../controllers/report.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:sessionId", getReport);



router.get(
    "/download/:sessionId",
    downloadReport
);

export default router;