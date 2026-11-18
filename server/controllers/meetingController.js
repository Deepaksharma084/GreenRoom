import pool from "../db.js";
import { generateRoomID } from "../utils/generateRoomID.js";
import { isValidRoomId, sanitizeString } from "../utils/validators.js";

// Phase 26: Production WebRTC Infrastructure (TURN Server config)
export const getIceServersConfig = (req, res) => {
    const iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ];

    const turnUrl = process.env.TURN_URL;
    const turnUsername = process.env.TURN_USERNAME;
    const turnCredential = process.env.TURN_CREDENTIAL;

    if (turnUrl && turnUsername && turnCredential) {
        iceServers.push({
            urls: turnUrl,
            username: turnUsername,
            credential: turnCredential
        });
    }

    return res.status(200).json({ iceServers });
};

export const createMeeting = async (req, res) => {
    const { title } = req.body;
    const roomName = sanitizeString(title, 100);

    if (!roomName) {
        return res.status(400).json({
            error: "Room name is required"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        let hostUserId = null;
        let hostGuestId = null;
        let displayName = "";

        // Google user
        if (req.user.type === "user") {
            hostUserId = req.user.userId;
            displayName = req.user.name;
        }
        // Guest user
        else if (req.user.type === "guest") {
            const guestResult = await client.query(
                `
                SELECT id, display_name
                FROM guest_sessions
                WHERE jwt_id = $1
                `,
                [req.user.jti]
            );

            if (guestResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    error: "Guest session not found"
                });
            }

            hostGuestId = guestResult.rows[0].id;
            displayName = guestResult.rows[0].display_name;
        }

        // Generate unique room ID
        const roomID = await generateRoomID();

        // Create meeting
        const meetingResult = await client.query(
            `
            INSERT INTO meetings
            (
                room_id,
                room_name,
                host_user_id,
                host_guest_id
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                roomID,
                roomName,
                hostUserId,
                hostGuestId
            ]
        );

        const meeting = meetingResult.rows[0];

        // Add host as the first participant
        await client.query(
            `
            INSERT INTO meeting_participants
            (
                meeting_id,
                user_id,
                guest_session_id,
                display_name
            )
            VALUES ($1, $2, $3, $4)
            `,
            [
                meeting.id,
                hostUserId,
                hostGuestId,
                displayName
            ]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Meeting created successfully",
            meeting: {
                id: meeting.id,
                roomId: meeting.room_id,
                roomName: meeting.room_name
            }
        });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Create meeting error:", err);
        return res.status(500).json({
            error: "Internal server error while creating meeting"
        });
    } finally {
        client.release();
    }
};

export const validateMeeting = async (req, res) => {
    const { roomId } = req.params;
    const roomID = roomId?.trim().toUpperCase();

    if (!roomID || !isValidRoomId(roomID)) {
        return res.status(400).json({ error: "Invalid meeting ID format" });
    }

    try {
        let userId = null;
        let guestSessionId = null;

        if (req.user.type === "user") {
            userId = req.user.userId;
        } else if (req.user.type === "guest") {
            const guestResult = await pool.query(
                "SELECT id FROM guest_sessions WHERE jwt_id = $1",
                [req.user.jti]
            );
            if (guestResult.rows.length > 0) {
                guestSessionId = guestResult.rows[0].id;
            }
        }

        const meetingResult = await pool.query(
            `
            SELECT id, room_id, room_name, status, host_user_id, host_guest_id, started_at, ended_at
            FROM meetings
            WHERE room_id = $1
            `,
            [roomID]
        );

        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        const meeting = meetingResult.rows[0];

        if (meeting.status === "ENDED") {
            return res.status(400).json({
                error: "Meeting has already ended",
                isEnded: true
            });
        }

        const isHost = (userId && meeting.host_user_id === userId) ||
                       (guestSessionId && meeting.host_guest_id === guestSessionId);

        return res.status(200).json({
            meeting: {
                id: meeting.id,
                roomId: meeting.room_id,
                roomName: meeting.room_name,
                status: meeting.status,
                isHost: Boolean(isHost)
            }
        });

    } catch (err) {
        console.error("Validate meeting error:", err);
        return res.status(500).json({ error: "Internal server error while validating meeting" });
    }
};

export const joinMeeting = async (req, res) => {
    const roomID = req.body.roomId?.trim().toUpperCase();

    if (!roomID || !isValidRoomId(roomID)) {
        return res.status(400).json({
            error: "Invalid meeting ID format"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Find meeting
        const meetingResult = await client.query(
            `
            SELECT id, status
            FROM meetings
            WHERE room_id = $1
            `,
            [roomID]
        );

        if (meetingResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                error: "Meeting not found"
            });
        }

        const meeting = meetingResult.rows[0];

        if (meeting.status === "ENDED") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                error: "Meeting has already ended"
            });
        }

        let userId = null;
        let guestSessionId = null;
        let displayName = "";

        // Google user
        if (req.user.type === "user") {
            userId = req.user.userId;
            displayName = req.user.name;
        }
        // Guest user
        else if (req.user.type === "guest") {
            const guestResult = await client.query(
                `
                SELECT id, display_name
                FROM guest_sessions
                WHERE jwt_id = $1
                `,
                [req.user.jti]
            );

            if (guestResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    error: "Guest session not found"
                });
            }

            guestSessionId = guestResult.rows[0].id;
            displayName = guestResult.rows[0].display_name;
        }

        // Join meeting with upsert to cleanly handle reconnects/refreshes
        if (userId) {
            await client.query(
                `
                INSERT INTO meeting_participants
                (
                    meeting_id,
                    user_id,
                    guest_session_id,
                    display_name
                )
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (meeting_id, user_id) WHERE user_id IS NOT NULL
                DO UPDATE SET left_at = NULL, joined_at = CURRENT_TIMESTAMP, display_name = EXCLUDED.display_name
                `,
                [meeting.id, userId, null, displayName]
            );
        } else if (guestSessionId) {
            await client.query(
                `
                INSERT INTO meeting_participants
                (
                    meeting_id,
                    user_id,
                    guest_session_id,
                    display_name
                )
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (meeting_id, guest_session_id) WHERE guest_session_id IS NOT NULL
                DO UPDATE SET left_at = NULL, joined_at = CURRENT_TIMESTAMP, display_name = EXCLUDED.display_name
                `,
                [meeting.id, null, guestSessionId, displayName]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Joined meeting successfully",
            meeting: {
                id: meeting.id,
                roomId: roomID
            }
        });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Join meeting error:", err);
        return res.status(500).json({
            error: "Internal server error while joining meeting"
        });
    } finally {
        client.release();
    }
};

export const leaveMeeting = async (req, res) => {
    const roomID = req.body.roomId?.trim().toUpperCase();

    if (!roomID || !isValidRoomId(roomID)) {
        return res.status(400).json({ error: "Invalid meeting ID format" });
    }

    try {
        let userId = null;
        let guestSessionId = null;

        if (req.user.type === "user") {
            userId = req.user.userId;
        } else if (req.user.type === "guest") {
            const guestResult = await pool.query(
                "SELECT id FROM guest_sessions WHERE jwt_id = $1",
                [req.user.jti]
            );
            if (guestResult.rows.length > 0) {
                guestSessionId = guestResult.rows[0].id;
            }
        }

        const meetingResult = await pool.query(
            "SELECT id FROM meetings WHERE room_id = $1",
            [roomID]
        );

        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        const meetingId = meetingResult.rows[0].id;

        await pool.query(
            `
            UPDATE meeting_participants
            SET left_at = CURRENT_TIMESTAMP
            WHERE meeting_id = $1
              AND (
                  (user_id IS NOT NULL AND user_id = $2)
                  OR
                  (guest_session_id IS NOT NULL AND guest_session_id = $3)
              )
            `,
            [meetingId, userId, guestSessionId]
        );

        return res.status(200).json({ message: "Left meeting successfully" });
    } catch (err) {
        console.error("Leave meeting error:", err);
        return res.status(500).json({ error: "Failed to record leave" });
    }
};

export const endMeeting = async (req, res) => {
    const roomID = req.body.roomId?.trim().toUpperCase();

    if (!roomID || !isValidRoomId(roomID)) {
        return res.status(400).json({ error: "Invalid meeting ID format" });
    }

    try {
        let userId = null;
        let guestSessionId = null;

        if (req.user.type === "user") {
            userId = req.user.userId;
        } else if (req.user.type === "guest") {
            const guestResult = await pool.query(
                "SELECT id FROM guest_sessions WHERE jwt_id = $1",
                [req.user.jti]
            );
            if (guestResult.rows.length > 0) {
                guestSessionId = guestResult.rows[0].id;
            }
        }

        const meetingResult = await pool.query(
            `
            SELECT id, host_user_id, host_guest_id, status
            FROM meetings
            WHERE room_id = $1
            `,
            [roomID]
        );

        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        const meeting = meetingResult.rows[0];

        const isHost = (userId && meeting.host_user_id === userId) ||
                       (guestSessionId && meeting.host_guest_id === guestSessionId);

        if (!isHost) {
            return res.status(403).json({ error: "Only the host can end the meeting" });
        }

        // Set status ENDED and ended_at
        await pool.query(
            `
            UPDATE meetings
            SET status = 'ENDED', ended_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [meeting.id]
        );

        // Mark remaining participants left_at
        await pool.query(
            `
            UPDATE meeting_participants
            SET left_at = CURRENT_TIMESTAMP
            WHERE meeting_id = $1 AND left_at IS NULL
            `,
            [meeting.id]
        );

        // Emit socket event to all clients in the room
        const io = req.app.get("io");
        if (io) {
            io.to(roomID).emit("meeting-ended");
        }

        return res.status(200).json({ message: "Meeting ended successfully" });
    } catch (err) {
        console.error("End meeting error:", err);
        return res.status(500).json({ error: "Failed to end meeting" });
    }
};

export const getMeetingHistory = async (req, res) => {
    try {
        let userId = null;
        let guestSessionId = null;

        if (req.user.type === "user") {
            userId = req.user.userId;
        } else if (req.user.type === "guest") {
            const guestResult = await pool.query(
                "SELECT id FROM guest_sessions WHERE jwt_id = $1",
                [req.user.jti]
            );
            if (guestResult.rows.length > 0) {
                guestSessionId = guestResult.rows[0].id;
            }
        }

        const result = await pool.query(
            `
            SELECT
                m.id AS meeting_id,
                m.room_id,
                m.room_name,
                m.status,
                m.started_at,
                m.ended_at,
                mp.joined_at,
                mp.left_at,
                mp.display_name,
                EXTRACT(EPOCH FROM (COALESCE(mp.left_at, m.ended_at, CURRENT_TIMESTAMP) - mp.joined_at))::INTEGER AS duration_seconds,
                CASE
                    WHEN (m.host_user_id IS NOT NULL AND m.host_user_id = $1)
                      OR (m.host_guest_id IS NOT NULL AND m.host_guest_id = $2)
                    THEN true
                    ELSE false
                END AS is_host
            FROM meeting_participants mp
            JOIN meetings m ON mp.meeting_id = m.id
            WHERE (mp.user_id IS NOT NULL AND mp.user_id = $1)
               OR (mp.guest_session_id IS NOT NULL AND mp.guest_session_id = $2)
            ORDER BY mp.joined_at DESC
            `,
            [userId, guestSessionId]
        );

        return res.status(200).json({
            history: result.rows
        });
    } catch (err) {
        console.error("Meeting history error:", err);
        return res.status(500).json({ error: "Failed to fetch meeting history" });
    }
};
