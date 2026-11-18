import express from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

import {
    createMeeting,
    validateMeeting,
    joinMeeting,
    leaveMeeting,
    endMeeting,
    getMeetingHistory,
    getIceServersConfig
} from "../controllers/meetingController.js";

const router = express.Router();

// Strict limiter for meeting join/create to prevent brute force ID guessing
const joinLimiter = createRateLimiter({
    windowMs: 60000,
    max: 20,
    message: "Too many room join attempts. Please wait a moment."
});

router.post("/create", verifyJWT, joinLimiter, createMeeting);
router.get("/validate/:roomId", verifyJWT, joinLimiter, validateMeeting);
router.post("/join", verifyJWT, joinLimiter, joinMeeting);
router.post("/leave", verifyJWT, leaveMeeting);
router.post("/end", verifyJWT, endMeeting);
router.get("/history", verifyJWT, getMeetingHistory);
router.get("/ice-servers", verifyJWT, getIceServersConfig);

export default router;
