export const initializeSocket = (io) => {

    io.on("connection", (socket) => {

        console.log("Socket connected:", socket.id);

        socket.on("join-room", (roomId) => {

            socket.join(roomId);

            console.log(
                `${socket.id} joined room ${roomId}`
            );

            socket.to(roomId).emit("user-joined", {
                socketId: socket.id
            });
        });

        socket.on("offer", ({ roomId, offer }) => {

            socket.to(roomId).emit("offer", {
                socketId: socket.id,
                offer
            });

        });

        socket.on("answer", ({ roomId, answer }) => {

            socket.to(roomId).emit("answer", {
                socketId: socket.id,
                answer
            });

        });

        socket.on("ice-candidate", ({ roomId, candidate }) => {

            socket.to(roomId).emit("ice-candidate", {
                socketId: socket.id,
                candidate
            });

        });

        socket.on("disconnect", () => {

            console.log("Socket disconnected:", socket.id);

        });

    });

};