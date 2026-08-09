import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket.js";

export default function useWebRTC(roomId) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);

    const peerConnections = useRef({});

    useEffect(() => {
        let stream;

        const initialize = async () => {
            try {
                //Get camera and microphone
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                setLocalStream(stream);

                //Connect Socket.IO
                socket.connect();

                //Join the Socket.IO room
                socket.emit("join-room", roomId);

            } catch (error) {
                console.error(
                    "Error accessing camera/microphone:",
                    error
                );
            }
        };

        initialize();

        return () => {
            // Stop camera
            if (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            // Close all peer connections
            Object.values(peerConnections.current).forEach(
                (peerConnection) => {
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