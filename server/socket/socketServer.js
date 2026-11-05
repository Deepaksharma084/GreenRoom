export const initializeSocket = (io) => {

    const participants = new Map();
    const socketRoomMap = new Map();

    io.on("connection", (socket) => {

        console.log("Socket connected:", socket.id);

        socket.on("join-room", ({ roomId, name }) => {

            // Get participants already in the room
            const roomParticipants =
                participants.get(roomId) || new Map();

            const existingUsers =
                Array.from(roomParticipants.entries()).map(
                    ([socketId, participant]) => ({
                        socketId,
                        name: participant.name
                    })
                );

            // Store this participant
            roomParticipants.set(socket.id, {
                name
            });

            participants.set(roomId, roomParticipants);
            socketRoomMap.set(socket.id, roomId);

            // Join Socket.IO room
            socket.join(roomId);

            console.log(
                `${name} (${socket.id}) joined room ${roomId}`
            );

            // Tells the new participant who is already there
            socket.emit("existing-users", {
                users: existingUsers
            });

            // Tells existing participants about the new participant
            socket.to(roomId).emit("user-joined", {
                socketId: socket.id,
                name
            });

        });

        // OFFER — include sender name so receiver can associate the peer
        socket.on("offer", ({ targetSocketId, offer }) => {

            const roomId = socketRoomMap.get(socket.id);
            const roomParticipants = participants.get(roomId);
            const senderName = roomParticipants?.get(socket.id)?.name || "Unknown";

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
        socket.on("ice-candidate",
            ({ targetSocketId, candidate }) => {

                io.to(targetSocketId).emit("ice-candidate", {
                    socketId: socket.id,
                    candidate
                });

            }
        );

        socket.on("mic-status", ({ roomId, isMicOn }) => {
            socket.to(roomId).emit("mic-status", {
                socketId: socket.id,
                isMicOn
            });
        });

        socket.on("camera-status", ({ roomId, isCameraOn }) => {
            socket.to(roomId).emit("camera-status", {
                socketId: socket.id,
                isCameraOn
            });
        });

        socket.on("disconnect", () => {

            console.log(
                "Socket disconnected:",
                socket.id
            );

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
            }

        });

    });

};
