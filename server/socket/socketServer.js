export const initializeSocket = (io) => {

    io.on("connection", (socket) => {

        console.log("Socket connected:", socket.id);

        socket.on("join-room", (roomId) => {

            socket.join(roomId);

            console.log(
                `${socket.id} joined room ${roomId}`
            );

            // Get everyone already inside the room
            const room = io.sockets.adapter.rooms.get(roomId);

            const existingUsers = room
                ? [...room].filter((socketId) => socketId !== socket.id)
                : [];

            // Tell the new user who is already inside
            socket.emit("existing-users", {
                users: existingUsers
            });

            // Tell existing users about the new user
            socket.to(roomId).emit("user-joined", {
                socketId: socket.id
            });
        });

        // OFFER
        socket.on("offer", ({ targetSocketId, offer }) => {

            io.to(targetSocketId).emit("offer", {
                socketId: socket.id,
                offer
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

        socket.on("disconnect", () => {

            console.log(
                "Socket disconnected:",
                socket.id
            );

            // Tell everyone that this user left
            socket.broadcast.emit("user-left", {
                socketId: socket.id
            });

        });

    });

};