import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

export default function MeetingPage() {

    const { roomId } = useParams();

    useEffect(() => {

        const socket = io("http://localhost:5000", {
            withCredentials: true
        });

        socket.on("connect", () => {

            console.log("Connected:", socket.id);

            socket.emit("join-room", roomId);

        });

        socket.on("user-joined", (data) => {

            console.log("New user joined:", data.socketId);

        });

        return () => {
            socket.disconnect();
        };

    }, [roomId]);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,243,208,0.85),_rgba(5,46,22,0.95))] px-4 py-10 text-emerald-950">
            <div>
                <h1>Meeting Page</h1>
                <p>Room ID: {roomId}</p>
            </div>
        </div>
    );
}