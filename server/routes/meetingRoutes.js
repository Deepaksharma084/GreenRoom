router.post("/create", verifyJWT, createMeeting);

router.post("/join", verifyJWT, joinMeeting);

router.post("/leave", verifyJWT, leaveMeeting);

router.get("/history", verifyJWT, getMeetingHistory);