import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket.js";

export default function useWebRTC(roomId) {

    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);

    const peerConnections = useRef({});
    const localStreamRef = useRef(null);

    const toggleMicrophone = () => {
        const stream = localStreamRef.current;

        if (!stream) return;

        const audioTracks = stream.getAudioTracks();

        if (audioTracks.length === 0) return;

        const newMicState = !audioTracks[0].enabled;

        audioTracks.forEach((track) => {
            track.enabled = newMicState;
        });

        setIsMicOn(newMicState);

        socket.emit("mic-status", {
            roomId,
            isMicOn: newMicState
        });
    };

    const toggleCamera = () => {
        const stream = localStreamRef.current;

        if (!stream) return;

        const videoTracks = stream.getVideoTracks();

        if (videoTracks.length === 0) return;

        const newCameraState = !videoTracks[0].enabled;

        videoTracks.forEach((track) => {
            track.enabled = newCameraState;
        });

        setIsCameraOn(newCameraState);

        socket.emit("camera-status", {
            roomId,
            isCameraOn: newCameraState
        });
    };

    useEffect(() => {

        const startMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                setLocalStream(stream);
                setIsMicOn(true);

                return stream;
            } catch (error) {
                console.error("Failed to access camera/microphone:", error);
                throw error;
            }
        };

        let stream;

        const createPeerConnection = (remoteSocketId) => {

            console.log("Creating peer connection with:", remoteSocketId);

            const peerConnection =
                new RTCPeerConnection({
                    iceServers: [
                        {
                            urls: "stun:stun.l.google.com:19302"
                        }
                    ]
                });

            // Add local camera + microphone
            stream.getTracks().forEach((track) => {

                peerConnection.addTrack(
                    track,
                    stream
                );

            });

            // Receive remote stream
            peerConnection.ontrack = (event) => {

                console.log("🔥 REMOTE TRACK RECEIVED FROM:", remoteSocketId, event.streams);

                const [remoteStream] = event.streams;

                if (!remoteStream) {
                    console.error("❌ No remote stream");
                    return;
                }

                console.log("Received remote stream from:", remoteSocketId);

                setRemoteStreams((previousStreams) => {

                    const existing =
                        previousStreams.find((item) =>
                            item.socketId === remoteSocketId
                        );

                    if (existing) {

                        return previousStreams;

                    }

                    return [
                        ...previousStreams,
                        {
                            socketId: remoteSocketId,
                            stream: remoteStream,
                            isMicOn: true,
                            isCameraOn: true
                        }
                    ];

                });

            };

            // ICE candidate
            peerConnection.onicecandidate = (
                event
            ) => {

                if (!event.candidate) {
                    return;
                }

                console.log("🧊 Sending ICE to:", remoteSocketId);

                socket.emit("ice-candidate", {

                    targetSocketId: remoteSocketId,

                    candidate: event.candidate

                });

            };

            peerConnections.current[remoteSocketId] = peerConnection;

            return peerConnection;
        };

        const createOffer = async (remoteSocketId) => {

            console.log("🟡 createOffer() for:", remoteSocketId);

            const peerConnection = peerConnections.current[remoteSocketId] ||
                createPeerConnection(
                    remoteSocketId
                );

            const offer = await peerConnection.createOffer();

            await peerConnection.setLocalDescription(
                offer
            );

            console.log("🟡 Sending OFFER to:", remoteSocketId);

            socket.emit("offer", { targetSocketId: remoteSocketId, offer });

        };

        const handleExistingUsers = async ({ users }) => {

            console.log("🟢 EXISTING USERS:", users);

            for (const remoteSocketId of users) {
                console.log("🟢 Creating offer for:", remoteSocketId);
                await createOffer(remoteSocketId);

            }

        };

        const handleUserJoined = ({ socketId }) => {

            console.log("New user joined:", socketId);

        };

        const handleOffer = async ({ socketId, offer }) => {

            console.log("🔵 OFFER RECEIVED FROM:", socketId);

            let peerConnection = peerConnections.current[socketId];

            if (!peerConnection) {

                peerConnection = createPeerConnection(socketId);
            }

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                    offer
                )
            );

            console.log("🔵 Remote description set");

            const answer = await peerConnection.createAnswer();

            await peerConnection.setLocalDescription(
                answer
            );

            console.log("🔵 Sending ANSWER to:", socketId);

            socket.emit("answer", {

                targetSocketId: socketId,
                answer

            });

        };

        const handleAnswer = async ({ socketId, answer }) => {

            console.log("🟣 ANSWER RECEIVED FROM:", socketId);

            const peerConnection = peerConnections.current[socketId];

            if (!peerConnection) {
                console.error("❌ No peer connection for:", socketId);
                return;
            }

            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                    answer
                )
            );

        };

        const handleIceCandidate = async ({ socketId, candidate }) => {

            console.log("🧊 ICE RECEIVED FROM:", socketId);

            const peerConnection = peerConnections.current[socketId];

            if (!peerConnection) {
                console.error("❌ No peer connection for ICE:", socketId);
                return;
            }

            try {

                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(
                        candidate
                    )
                );

            } catch (error) {

                console.error("Error adding ICE candidate:", error);

            }

        };

        const handleUserLeft = ({ socketId }) => {

            console.log("User left:", socketId);

            const peerConnection = peerConnections.current[socketId];

            if (peerConnection) {

                peerConnection.close();

                delete peerConnections.current[socketId];

            }

            setRemoteStreams(
                (previousStreams) =>
                    previousStreams.filter(
                        (item) =>
                            item.socketId !== socketId
                    )
            );

        };

        const initializeWebRTC = async () => {

            try {

                stream = await navigator.mediaDevices
                    .getUserMedia({
                        video: true,
                        audio: true
                    });

                localStreamRef.current = stream;

                setLocalStream(stream);

                socket.connect();

                socket.emit("join-room", roomId);

            } catch (error) {

                console.error("Camera/microphone error:", error);

            }

        };

        const handleMicStatus = ({ socketId, isMicOn }) => {

            setRemoteStreams((prev) =>
                prev.map((participant) =>
                    participant.socketId === socketId
                        ? {
                            ...participant,
                            isMicOn
                        }
                        : participant
                )
            );

        };

        const handleCameraStatus = ({ socketId, isCameraOn }) => {

            setRemoteStreams((prev) =>
                prev.map((participant) =>
                    participant.socketId === socketId
                        ? {
                            ...participant,
                            isCameraOn
                        }
                        : participant
                )
            );

        };

        socket.on(
            "existing-users",
            handleExistingUsers
        );

        socket.on(
            "user-joined",
            handleUserJoined
        );

        socket.on(
            "offer",
            handleOffer
        );

        socket.on(
            "answer",
            handleAnswer
        );

        socket.on(
            "ice-candidate",
            handleIceCandidate
        );

        socket.on(
            "user-left",
            handleUserLeft
        );

        socket.on(
            "mic-status",
            handleMicStatus
        );

        socket.on(
            "camera-status",
            handleCameraStatus
        );

        initializeWebRTC();

        return () => {

            socket.off(
                "existing-users",
                handleExistingUsers
            );

            socket.off(
                "user-joined",
                handleUserJoined
            );

            socket.off(
                "offer",
                handleOffer
            );

            socket.off(
                "answer",
                handleAnswer
            );

            socket.off(
                "ice-candidate",
                handleIceCandidate
            );

            socket.off(
                "mic-status",
                handleMicStatus
            );

            socket.off(
                "camera-status",
                handleCameraStatus
            );

            socket.off(
                "user-left",
                handleUserLeft
            );

            Object.values(
                peerConnections.current
            ).forEach(
                (peerConnection) => {
                    peerConnection.close();
                }
            );

            peerConnections.current = {};

            if (stream) {

                stream
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

            }

            socket.disconnect();

        };

    }, [roomId]);

    return {
        localStream,
        remoteStreams,
        isMicOn,
        toggleMicrophone,
        isCameraOn,
        toggleCamera
    };
}