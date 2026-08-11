import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket.js";

export default function useWebRTC(roomId) {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);

    const peerConnections = useRef({});

    useEffect(() => {
        let stream;

        const createPeerConnection = (remoteSocketId) => {
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302"
                    }
                ]
            });

            // Add our camera and microphone to the connection
            stream.getTracks().forEach((track) => {
                peerConnection.addTrack(track, stream);
            });

            // Receive remote camera/microphone
            peerConnection.ontrack = (event) => {
                const [remoteStream] = event.streams;

                if (!remoteStream) {
                    return;
                }

                setRemoteStreams((previousStreams) => {
                    const alreadyExists = previousStreams.some(
                        (item) => item.socketId === remoteSocketId
                    );

                    if (alreadyExists) {
                        return previousStreams;
                    }

                    return [
                        ...previousStreams,
                        {
                            socketId: remoteSocketId,
                            stream: remoteStream
                        }
                    ];
                });
            };

            // Send ICE candidates through Socket.IO
            peerConnection.onicecandidate = (event) => {
                if (!event.candidate) {
                    return;
                }

                socket.emit("ice-candidate", {
                    roomId,
                    candidate: event.candidate
                });
            };

            peerConnections.current[remoteSocketId] = peerConnection;

            return peerConnection;
        };

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

                // Join meeting room
                socket.emit("join-room", roomId);

            } catch (error) {
                console.error(
                    "Failed to access camera/microphone:",
                    error
                );
            }
        };

        // Someone else joined the room
        const handleUserJoined = async ({ socketId }) => {
            console.log("New user joined:", socketId);

            const peerConnection = createPeerConnection(socketId);

            const offer = await peerConnection.createOffer();

            await peerConnection.setLocalDescription(offer);

            socket.emit("offer", {
                roomId,
                offer
            });
        };

        // Receive offer
        const handleOffer = async ({ socketId, offer }) => {
            console.log("Received offer from:", socketId);

            let peerConnection =
                peerConnections.current[socketId];

            if (!peerConnection) {
                peerConnection = createPeerConnection(socketId);
            }

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer =
                await peerConnection.createAnswer();

            await peerConnection.setLocalDescription(answer);

            socket.emit("answer", {
                roomId,
                answer
            });
        };

        // Receive answer
        const handleAnswer = async ({ socketId, answer }) => {
            console.log("Received answer from:", socketId);

            const peerConnection =
                peerConnections.current[socketId];

            if (!peerConnection) {
                return;
            }

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        };

        // Receive ICE candidate
        const handleIceCandidate = async ({
            socketId,
            candidate
        }) => {
            console.log(
                "Received ICE candidate from:",
                socketId
            );

            const peerConnection =
                peerConnections.current[socketId];

            if (!peerConnection) {
                return;
            }

            try {
                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );
            } catch (error) {
                console.error(
                    "Error adding ICE candidate:",
                    error
                );
            }
        };

        initializeWebRTC();

        socket.on("user-joined", handleUserJoined);
        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);

        return () => {
            socket.off("user-joined", handleUserJoined);
            socket.off("offer", handleOffer);
            socket.off("answer", handleAnswer);
            socket.off(
                "ice-candidate",
                handleIceCandidate
            );

            Object.values(peerConnections.current).forEach(
                (peerConnection) => {
                    peerConnection.close();
                }
            );

            peerConnections.current = {};

            if (stream) {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            }

            socket.disconnect();
        };

    }, [roomId]);

    return {
        localStream,
        remoteStreams
    };
}