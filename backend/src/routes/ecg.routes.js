import express from "express";

import {
    processECG,
    getHistory,
    getSession,
    deleteSession
} from "../controllers/ecg.controller.js";

const router = express.Router();

router.post("/process", processECG);



router.get("/history/:profileId", getHistory);

router.get("/session/:id", getSession);

router.delete("/session/:id", deleteSession);

export default router;