import express from "express";

import { processECG } from "../controllers/ecg.controller.js";

const router = express.Router();

router.post("/process", processECG);

export default router;