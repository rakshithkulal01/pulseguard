import express from "express";

import {
    createProfile,
    getProfiles,
    getProfileById,
    updateProfile,
    deleteProfile
} from "../controllers/profile.controller.js";

const router = express.Router();

router.post("/", createProfile);

router.get("/", getProfiles);

router.get("/:id", getProfileById);

router.put("/:id", updateProfile);

router.delete("/:id", deleteProfile);

export default router;