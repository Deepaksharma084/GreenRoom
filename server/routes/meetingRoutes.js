import express from "express";
import passport from "passport";
import verifyJWT from "../middleware/verifyJWT.js";

import {
    createMeeting,
    joinMeeting,
    leaveMeeting,
    getMeetingHistory
} from "../controllers/meetingController.js";

const router = express.Router();

router.post("/create", verifyJWT, createMeeting);

router.post("/join", verifyJWT, joinMeeting);

router.post("/leave", verifyJWT, leaveMeeting);

router.get("/history", verifyJWT, getMeetingHistory);

export default router;