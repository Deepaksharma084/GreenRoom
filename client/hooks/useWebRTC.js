import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket.js";

export default function useWebRTC(roomId) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);

    const peerConnections = useRef({});

    useEffect(() => {
        let stream;

        const initializeWebRTC = async () => {
            try {
                // Get camera + microphone
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                setLocalStream(stream);

                // Connect Socket.IO
                socket.connect();

                // Tell server which meeting we joined
                socket.emit("join-room", roomId);

            } catch (error) {
                console.error(
                    "Failed to access camera/microphone:",
                    error
                );
            }
        };

        initializeWebRTC();

        return () => {
            // Stop camera and microphone
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
            }

            // Close peer connections
            Object.values(peerConnections.current).forEach(
                peerConnection => {
                    peerConnection.close();
                }
            );

            peerConnections.current = {};

            socket.disconnect();
        };
    }, [roomId]);

    return {
        localStream,
        remoteStreams
    };
}