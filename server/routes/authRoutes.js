import express from "express";

import {
    guestLogin,
    googleLogin,
    googleCallback,
    logout,
    getCurrentUser
} from "../controllers/authController.js";

const router = express.Router();

router.post("/guest", guestLogin);

router.get("/google", googleLogin);

router.get("/google/callback", googleCallback);

router.post("/logout", logout);

router.get("/me", getCurrentUser);

export default router;