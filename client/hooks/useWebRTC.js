import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket.js";
import { getIceServers } from "../src/utils/iceConfig.js";

export default function useWebRTC(roomId, currentUser) {

    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [isMeetingEnded, setIsMeetingEnded] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");

    const peerConnections = useRef({});
    const peerNames = useRef({});
    const localStreamRef = useRef(null);
    const pendingCandidates = useRef({});
    const screenStreamRef = useRef(null);
    const iceServersRef = useRef([{ urls: "stun:stun.l.google.com:19302" }]);

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

    // Explicit leave — stops all media, closes connections, disconnects socket
    const handleLeave = () => {
        // Stop screen share if active
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
            setIsScreenSharing(false);
        }

        // Stop local media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }

        // Close all peer connections
        Object.values(peerConnections.current).forEach((pc) => pc.close());
        peerConnections.current = {};
        peerNames.current = {};
        pendingCandidates.current = {};

        setRemoteStreams([]);

        // Disconnect socket
        socket.disconnect();
        setConnectionStatus("disconnected");
    };

    // Host Ends Meeting for Everyone
    const handleEndMeeting = () => {
        socket.emit("end-meeting", { roomId });
        handleLeave();
        setIsMeetingEnded(true);
    };

    // Replace camera track with screen track on all peer connections
    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true
            });

            const screenTrack = screenStream.getVideoTracks()[0];
            screenStreamRef.current = screenStream;

            // Replace the video track on every peer connection
            Object.values(peerConnections.current).forEach((pc) => {
                const videoSender = pc.getSenders().find(
                    (sender) => sender.track?.kind === "video"
                );
                if (videoSender) {
                    videoSender.replaceTrack(screenTrack);
                }
            });

            setIsScreenSharing(true);

            // Handle browser's native "Stop sharing" button
            screenTrack.onended = () => {
                stopScreenShare();
            };

        } catch (error) {
            console.error("Screen share error:", error);
        }
    };

    // Restore camera track on all peer connections
    const stopScreenShare = () => {
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];

        if (cameraTrack) {
            Object.values(peerConnections.current).forEach((pc) => {
                const videoSender = pc.getSenders().find(
                    (sender) => sender.track?.kind === "video"
                );
                if (videoSender) {
                    videoSender.replaceTrack(cameraTrack);
                }
            });
        }

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }

        setIsScreenSharing(false);
    };

    useEffect(() => {
        let isMounted = true;
        let stream;

        const createPeerConnection = (remoteSocketId, remoteName) => {
            if (remoteName) {
                peerNames.current[remoteSocketId] = remoteName;
            }

            const peerConnection = new RTCPeerConnection({
                iceServers: iceServersRef.current
            });

            // Add local camera + microphone if available
            if (stream) {
                stream.getTracks().forEach((track) => {
                    peerConnection.addTrack(track, stream);
                });
            }

            // Phase 12: WebRTC Connection State Handling
            peerConnection.onconnectionstatechange = () => {
                const state = peerConnection.connectionState;

                if (state === "failed" || state === "closed") {
                    peerConnection.close();
                    delete peerConnections.current[remoteSocketId];
                    delete peerNames.current[remoteSocketId];
                    delete pendingCandidates.current[remoteSocketId];

                    setRemoteStreams((previousStreams) =>
                        previousStreams.filter((item) => item.socketId !== remoteSocketId)
                    );
                }
            };

            // Receive remote stream
            peerConnection.ontrack = (event) => {
                const [remoteStream] = event.streams;
                if (!remoteStream) {
                    return;
                }

                const displayName = peerNames.current[remoteSocketId] || remoteName || "Participant";

                setRemoteStreams((previousStreams) => {
                    const existing = previousStreams.find((item) => item.socketId === remoteSocketId);

                    if (existing) {
                        return previousStreams.map((item) =>
                            item.socketId === remoteSocketId
                                ? { ...item, stream: remoteStream, name: displayName }
                                : item
                        );
                    }

                    return [
                        ...previousStreams,
                        {
                            socketId: remoteSocketId,
                            stream: remoteStream,
                            name: displayName,
                            isMicOn: true,
                            isCameraOn: true
                        }
                    ];
                });
            };

            // ICE candidate
            peerConnection.onicecandidate = (event) => {
                if (!event.candidate) return;

                socket.emit("ice-candidate", {
                    targetSocketId: remoteSocketId,
                    candidate: event.candidate
                });
            };

            peerConnections.current[remoteSocketId] = peerConnection;
            return peerConnection;
        };

        const createOffer = async (remoteSocketId, remoteName) => {
            const peerConnection =
                peerConnections.current[remoteSocketId] ||
                createPeerConnection(remoteSocketId, remoteName);

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.emit("offer", { targetSocketId: remoteSocketId, offer });
        };

        const handleExistingUsers = async ({ users }) => {
            for (const user of users) {
                await createOffer(user.socketId, user.name);
            }
        };

        const handleUserJoined = ({ socketId, name }) => {
            peerNames.current[socketId] = name;
        };

        const handleOffer = async ({ socketId, offer, name }) => {
            let peerConnection = peerConnections.current[socketId];
            if (!peerConnection) {
                peerConnection = createPeerConnection(socketId, name);
            } else if (name) {
                peerNames.current[socketId] = name;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Flush any pending ICE candidates for this peer
            if (pendingCandidates.current[socketId]) {
                for (const candidate of pendingCandidates.current[socketId]) {
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (error) {
                        console.error("Error adding queued ICE candidate:", error);
                    }
                }
                delete pendingCandidates.current[socketId];
            }

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socket.emit("answer", {
                targetSocketId: socketId,
                answer
            });
        };

        const handleAnswer = async ({ socketId, answer }) => {
            const peerConnection = peerConnections.current[socketId];

            if (!peerConnection) {
                return;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

            // Flush any pending ICE candidates for this peer
            if (pendingCandidates.current[socketId]) {
                for (const candidate of pendingCandidates.current[socketId]) {
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (error) {
                        console.error("Error adding queued ICE candidate:", error);
                    }
                }
                delete pendingCandidates.current[socketId];
            }
        };

        // Queue ICE candidates that arrive before remote description is set
        const handleIceCandidate = async ({ socketId, candidate }) => {
            const peerConnection = peerConnections.current[socketId];

            if (!peerConnection || !peerConnection.remoteDescription) {
                if (!pendingCandidates.current[socketId]) {
                    pendingCandidates.current[socketId] = [];
                }
                pendingCandidates.current[socketId].push(candidate);
                return;
            }

            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
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

            delete peerNames.current[socketId];
            delete pendingCandidates.current[socketId];

            setRemoteStreams((previousStreams) =>
                previousStreams.filter((item) => item.socketId !== socketId)
            );
        };

        const handleConnect = () => {
            console.log("Socket connected:", socket.id);
            setConnectionStatus("connected");

            socket.emit("join-room", {
                roomId,
                name: currentUser.name
            });
        };

        const handleDisconnect = () => {
            console.log("Socket disconnected");
            setConnectionStatus("disconnected");
        };

        const handleConnectError = (err) => {
            console.error("Socket connection error:", err.message);
            setConnectionStatus("error");
            setMediaError(`Connection error: ${err.message}`);
        };

        // Phase 22: Meeting Ended by Host
        const handleMeetingEnded = () => {
            console.log("Meeting ended by host");
            handleLeave();
            setIsMeetingEnded(true);
        };

        // Phase 15 & 16: Device & Permission Handling with progressive fallback
        const initializeWebRTC = async () => {
            setConnectionStatus("connecting");

            // Phase 26: Load production ICE servers (TURN/STUN)
            try {
                const configuredIce = await getIceServers();
                if (configuredIce && isMounted) {
                    iceServersRef.current = configuredIce;
                }
            } catch (iceErr) {
                console.warn("Failed to load ICE servers:", iceErr);
            }
            try {
                // Try dual video + audio
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            } catch (firstErr) {
                console.warn("Dual track acquisition failed, trying audio-only / video-only:", firstErr.name);

                // Try audio-only
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    setIsCameraOn(false);
                    setMediaError("Camera is unavailable or permission denied. Joined with microphone only.");
                } catch {
                    // Try video-only
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                        setIsMicOn(false);
                        setMediaError("Microphone is unavailable or permission denied. Joined with camera only.");
                    } catch (finalErr) {
                        console.error("Media permission completely denied or device not found:", finalErr);
                        setIsCameraOn(false);
                        setIsMicOn(false);

                        if (finalErr.name === "NotAllowedError") {
                            setMediaError("Camera and microphone access were denied. Joined in listen-only mode.");
                        } else if (finalErr.name === "NotFoundError") {
                            setMediaError("No camera or microphone found on this device.");
                        } else {
                            setMediaError("Unable to access media devices: " + (finalErr.message || finalErr.name));
                        }

                        // Create an empty MediaStream so the user can still connect and view others
                        stream = new MediaStream();
                    }
                }
            }

            if (!isMounted) {
                if (stream) stream.getTracks().forEach((track) => track.stop());
                return;
            }

            localStreamRef.current = stream;
            setLocalStream(stream);

            if (!socket.connected) {
                socket.connect();
            }
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);

        socket.on("existing-users", handleExistingUsers);
        socket.on("user-joined", handleUserJoined);
        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);
        socket.on("user-left", handleUserLeft);
        socket.on("meeting-ended", handleMeetingEnded);

        const handleMicStatus = ({ socketId, isMicOn }) => {
            setRemoteStreams((prev) =>
                prev.map((participant) =>
                    participant.socketId === socketId ? { ...participant, isMicOn } : participant
                )
            );
        };

        const handleCameraStatus = ({ socketId, isCameraOn }) => {
            setRemoteStreams((prev) =>
                prev.map((participant) =>
                    participant.socketId === socketId ? { ...participant, isCameraOn } : participant
                )
            );
        };

        socket.on("mic-status", handleMicStatus);
        socket.on("camera-status", handleCameraStatus);

        initializeWebRTC();

        return () => {
            isMounted = false;

            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("existing-users", handleExistingUsers);
            socket.off("user-joined", handleUserJoined);
            socket.off("offer", handleOffer);
            socket.off("answer", handleAnswer);
            socket.off("ice-candidate", handleIceCandidate);
            socket.off("mic-status", handleMicStatus);
            socket.off("camera-status", handleCameraStatus);
            socket.off("user-left", handleUserLeft);
            socket.off("meeting-ended", handleMeetingEnded);

            Object.values(peerConnections.current).forEach((peerConnection) => {
                peerConnection.close();
            });

            peerConnections.current = {};
            peerNames.current = {};
            pendingCandidates.current = {};

            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            socket.disconnect();
        };

    }, [roomId, currentUser]);

    return {
        localStream,
        remoteStreams,
        isMicOn,
        toggleMicrophone,
        isCameraOn,
        toggleCamera,
        isScreenSharing,
        startScreenShare,
        stopScreenShare,
        handleLeave,
        handleEndMeeting,
        mediaError,
        isMeetingEnded,
        connectionStatus
    };
}
