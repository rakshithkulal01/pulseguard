import express from "express";

import {
    createProfile,
    getProfiles,
    getProfileById,
    updateProfile,
    deleteProfile
} from "../controllers/profile.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createProfile);

router.get("/", getProfiles);

router.get("/:id", getProfileById);

router.put("/:id", updateProfile);

router.delete("/:id", deleteProfile);

//temporary test route
router.post("/test", (req, res) => {
    res.json({
        success: true,
        message: "Profile route is working"
    });
});

export default router;