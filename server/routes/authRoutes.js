import express from "express";
import passport from "passport";
import verifyJWT from "../middleware/verifyJWT.js";

import {
    guestLogin,
    googleCallback,
    logout,
    getCurrentUser
} from "../controllers/authController.js";

const router = express.Router();

router.post("/guest", guestLogin);

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

// Step 2: Google redirects here
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false
    }),
    googleCallback
);

router.post("/logout", verifyJWT, logout);

router.get("/me", verifyJWT, getCurrentUser);

export default router;