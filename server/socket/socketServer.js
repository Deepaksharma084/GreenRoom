import jwt from "jsonwebtoken";
import pool from "../db.js";

function parseCookies(cookieHeader) {
    if (!cookieHeader) return {};
    return Object.fromEntries(
        cookieHeader.split(";").map((c) => {
            const [k, ...v] = c.trim().split("=");
            return [k, decodeURIComponent(v.join("="))];
        })
    );
}

export const initializeSocket = (io) => {
    // Phase 18: Socket.IO Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie);
            const token = cookies.accessToken || socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.type === "guest") {
                const result = await pool.query(
                    "SELECT id, display_name FROM guest_sessions WHERE jwt_id = $1 AND expires_at > NOW()",
                    [decoded.jti]
                );

                if (result.rows.length === 0) {
                    return next(new Error("Guest session expired"));
                }

                socket.user = {
                    id: result.rows[0].id,
                    type: "guest",
                    name: result.rows[0].display_name
                };
            } else if (decoded.type === "user") {
                const result = await pool.query(
                    "SELECT id, name, email FROM users WHERE id = $1",
                    [decoded.userId]
                );

                if (result.rows.length === 0) {
                    return next(new Error("User not found"));
                }

                socket.user = {
                    id: result.rows[0].id,
                    type: "user",
                    name: result.rows[0].name,
                    email: result.rows[0].email
                };
            } else {
                return next(new Error("Invalid token type"));
            }

            next();
        } catch (err) {
            console.error("Socket authentication error:", err.message);
            return next(new Error("Authentication failed"));
        }
    });

    const participants = new Map();
    const socketRoomMap = new Map();

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id} (${socket.user?.name})`);

        socket.on("join-room", async ({ roomId, name }) => {
            const roomID = roomId?.trim().toUpperCase();
            if (!roomID) return;

            // Phase 17 & 18: Reject ended or non-existent meetings on socket join
            try {
                const meetingCheck = await pool.query(
                    "SELECT id, status FROM meetings WHERE room_id = $1",
                    [roomID]
                );

                if (meetingCheck.rows.length === 0 || meetingCheck.rows[0].status === "ENDED") {
                    socket.emit("meeting-ended");
                    return;
                }
            } catch (dbErr) {
                console.error("Error validating room in join-room:", dbErr);
            }

            const participantName = socket.user?.name || name || "Participant";

            // Get participants already in the room
            const roomParticipants = participants.get(roomID) || new Map();

            const existingUsers = Array.from(roomParticipants.entries()).map(
                ([socketId, participant]) => ({
                    socketId,
                    name: participant.name
                })
            );

            // Store this participant
            roomParticipants.set(socket.id, {
                name: participantName,
                userId: socket.user?.id,
                userType: socket.user?.type
            });

            participants.set(roomID, roomParticipants);
            socketRoomMap.set(socket.id, roomID);

            // Join Socket.IO room
            socket.join(roomID);

            console.log(
                `${participantName} (${socket.id}) joined room ${roomID}`
            );

            // Tells the new participant who is already there
            socket.emit("existing-users", {
                users: existingUsers
            });

            // Tells existing participants about the new participant
            socket.to(roomID).emit("user-joined", {
                socketId: socket.id,
                name: participantName
            });
        });

        // OFFER — include sender name so receiver can associate the peer
        socket.on("offer", ({ targetSocketId, offer }) => {
            const roomId = socketRoomMap.get(socket.id);
            const roomParticipants = participants.get(roomId);
            const senderName = roomParticipants?.get(socket.id)?.name || socket.user?.name || "Unknown";

            io.to(targetSocketId).emit("offer", {
                socketId: socket.id,
                offer,
                name: senderName
            });
        });

        // ANSWER
        socket.on("answer", ({ targetSocketId, answer }) => {
            io.to(targetSocketId).emit("answer", {
                socketId: socket.id,
                answer
            });
        });

        // ICE CANDIDATE
        socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
            io.to(targetSocketId).emit("ice-candidate", {
                socketId: socket.id,
                candidate
            });
        });

        // MIC STATUS
        socket.on("mic-status", ({ roomId, isMicOn }) => {
            const roomID = roomId?.trim().toUpperCase();
            socket.to(roomID).emit("mic-status", {
                socketId: socket.id,
                isMicOn
            });
        });

        // CAMERA STATUS
        socket.on("camera-status", ({ roomId, isCameraOn }) => {
            const roomID = roomId?.trim().toUpperCase();
            socket.to(roomID).emit("camera-status", {
                socketId: socket.id,
                isCameraOn
            });
        });

        // Phase 22: Host Ends Meeting
        socket.on("end-meeting", async ({ roomId }) => {
            const roomID = roomId?.trim().toUpperCase();
            if (!roomID || !socket.user) return;

            try {
                const meetingResult = await pool.query(
                    "SELECT id, host_user_id, host_guest_id, status FROM meetings WHERE room_id = $1",
                    [roomID]
                );

                if (meetingResult.rows.length > 0) {
                    const meeting = meetingResult.rows[0];
                    const isHost =
                        (socket.user.type === "user" && meeting.host_user_id === socket.user.id) ||
                        (socket.user.type === "guest" && meeting.host_guest_id === socket.user.id);

                    if (isHost) {
                        await pool.query(
                            "UPDATE meetings SET status = 'ENDED', ended_at = CURRENT_TIMESTAMP WHERE id = $1",
                            [meeting.id]
                        );
                        await pool.query(
                            "UPDATE meeting_participants SET left_at = CURRENT_TIMESTAMP WHERE meeting_id = $1 AND left_at IS NULL",
                            [meeting.id]
                        );
                        io.to(roomID).emit("meeting-ended");
                    }
                }
            } catch (err) {
                console.error("Socket end-meeting error:", err);
            }
        });

        // DISCONNECT
        socket.on("disconnect", async () => {
            console.log("Socket disconnected:", socket.id);
            const roomId = socketRoomMap.get(socket.id);

            if (roomId) {
                const roomParticipants = participants.get(roomId);

                if (roomParticipants) {
                    roomParticipants.delete(socket.id);

                    // Clean up empty rooms
                    if (roomParticipants.size === 0) {
                        participants.delete(roomId);
                    }
                }

                // Notify only participants in the same room
                socket.to(roomId).emit("user-left", {
                    socketId: socket.id
                });

                socketRoomMap.delete(socket.id);

                // Update database left_at timestamp
                if (socket.user) {
                    try {
                        const meetingResult = await pool.query(
                            "SELECT id FROM meetings WHERE room_id = $1",
                            [roomId]
                        );
                        if (meetingResult.rows.length > 0) {
                            const meetingId = meetingResult.rows[0].id;
                            const userId = socket.user.type === "user" ? socket.user.id : null;
                            const guestId = socket.user.type === "guest" ? socket.user.id : null;
                            await pool.query(
                                `
                                UPDATE meeting_participants
                                SET left_at = CURRENT_TIMESTAMP
                                WHERE meeting_id = $1
                                  AND left_at IS NULL
                                  AND (
                                      (user_id IS NOT NULL AND user_id = $2)
                                      OR
                                      (guest_session_id IS NOT NULL AND guest_session_id = $3)
                                  )
                                `,
                                [meetingId, userId, guestId]
                            );
                        }
                    } catch (dbErr) {
                        console.error("Error recording disconnect in DB:", dbErr);
                    }
                }
            }
        });
    });
};
