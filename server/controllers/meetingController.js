import pool from "../db.js";
import { generateRoomID } from "../utils/generateRoomID.js";

export const createMeeting = async (req, res) => {

    const { title } = req.body;

    const roomName = title?.trim();

    if (!roomName) {
        return res.status(400).json({
            error: "Room name is required"
        });
    }

    const client = await pool.connect();

    try {

        // Start transaction(At this point PostgreSQL says: I'm waiting, I won't permanently save anything until you tell me. )
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
                SELECT
                    id,
                    display_name
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

        // Save all changes
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

        // Undo everything if any query failed
        await client.query("ROLLBACK");

        console.error(err);

        return res.status(500).json({
            error: "Internal server error while creating meeting"
        });

    } finally {

        // Return client to the pool
        client.release();

    }

};