import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useWebRTC from "/hooks/useWebRTC.js";
import { getCurrentUser } from "/utils/getCurrentUser.js";
import VideoGrid from "../components/VideoGrid.jsx";
import MeetingControls from "../components/MeetingControls.jsx";
import ParticipantsPanel from "../components/ParticipantsPanel.jsx";

export default function MeetingPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [meetingInfo, setMeetingInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            try {
                // Step 1: Check authentication
                const user = await getCurrentUser();
                if (!user) {
                    navigate("/login");
                    return;
                }
                if (!isMounted) return;
                setCurrentUser(user);

                // Step 2: Validate meeting authorization (Phase 17)
                const validateRes = await fetch(`/meeting/validate/${roomId}`, {
                    credentials: "include"
                });

                const validateData = await validateRes.json();

                if (!validateRes.ok) {
                    if (validateRes.status === 404) {
                        setAuthError({
                            title: "Meeting Not Found",
                            message: "The meeting room you are trying to join does not exist or has expired."
                        });
                    } else if (validateData.isEnded || validateRes.status === 400) {
                        setAuthError({
                            title: "Meeting Ended",
                            message: "This meeting has already concluded."
                        });
                    } else {
                        setAuthError({
                            title: "Unable to Join",
                            message: validateData.error || "An error occurred while validating the room."
                        });
                    }
                    setLoading(false);
                    return;
                }

                // Step 3: Record participant in database (Phase 20)
                await fetch("/meeting/join", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ roomId })
                });

                if (isMounted) {
                    setMeetingInfo(validateData.meeting);
                    setLoading(false);
                }

            } catch (err) {
                console.error("Meeting init error:", err);
                if (isMounted) {
                    setAuthError({
                        title: "Connection Error",
                        message: "Failed to connect to the meeting service."
                    });
                    setLoading(false);
                }
            }
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, [roomId, navigate]);

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                <p className="mt-4 text-sm text-zinc-400">Joining meeting room...</p>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-white">
                <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-950/60 text-2xl text-red-400">
                        ⚠️
                    </div>
                    <h2 className="mt-4 text-2xl font-bold">{authError.title}</h2>
                    <p className="mt-2 text-sm text-zinc-400">{authError.message}</p>
                    <button
                        onClick={() => navigate("/")}
                        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!currentUser || !meetingInfo) {
        return null;
    }

    return (
        <MeetingContent
            roomId={roomId}
            currentUser={currentUser}
            meetingInfo={meetingInfo}
        />
    );
}

function MeetingContent({ roomId, currentUser, meetingInfo }) {
    const navigate = useNavigate();
    const [showParticipants, setShowParticipants] = useState(false);
    const [dismissMediaError, setDismissMediaError] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
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
    } = useWebRTC(roomId, currentUser);

    const onLeave = async () => {
        handleLeave();
        try {
            await fetch("/meeting/leave", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ roomId })
            });
        } catch (e) {
            console.error("Error calling leave API:", e);
        }
        navigate("/");
    };

    const onEndMeeting = async () => {
        handleEndMeeting();
        try {
            await fetch("/meeting/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ roomId })
            });
        } catch (e) {
            console.error("Error calling end meeting API:", e);
        }
        navigate("/");
    };

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative min-h-screen bg-black">

            {/* Header info bar */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">
                        {meetingInfo?.roomName || "GreenRoom Meeting"}
                    </span>
                    <button
                        onClick={copyRoomId}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/80 px-3 py-1 text-xs text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                        title="Copy Room ID"
                    >
                        <span>{roomId}</span>
                        <span>{copied ? "✓ Copied" : "📋"}</span>
                    </button>
                    {meetingInfo?.isHost && (
                        <span className="rounded-full bg-emerald-900/60 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                            Host
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`h-2.5 w-2.5 rounded-full ${
                            connectionStatus === "connected"
                                ? "bg-emerald-400"
                                : connectionStatus === "connecting"
                                ? "bg-yellow-400 animate-pulse"
                                : "bg-red-500"
                        }`}
                    />
                    <span className="text-xs capitalize text-zinc-400">
                        {connectionStatus}
                    </span>
                </div>
            </div>

            {/* Dismissible Media Error Warning */}
            {mediaError && !dismissMediaError && (
                <div className="absolute top-16 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-yellow-600/50 bg-yellow-950/90 px-4 py-2 text-xs text-yellow-200 shadow-xl backdrop-blur-md">
                    <span>⚠️ {mediaError}</span>
                    <button
                        onClick={() => setDismissMediaError(true)}
                        className="text-yellow-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Video Grid */}
            <VideoGrid
                localStream={localStream}
                remoteStreams={remoteStreams}
                isMicOn={isMicOn}
                isCameraOn={isCameraOn}
                currentUser={currentUser}
            />

            {/* Meeting Controls */}
            <MeetingControls
                isMicOn={isMicOn}
                onToggleMicrophone={toggleMicrophone}
                isCameraOn={isCameraOn}
                onToggleCamera={toggleCamera}
                isScreenSharing={isScreenSharing}
                onStartScreenShare={startScreenShare}
                onStopScreenShare={stopScreenShare}
                onToggleParticipants={() => setShowParticipants((prev) => !prev)}
                participantCount={1 + remoteStreams.length}
                onLeave={onLeave}
                isHost={meetingInfo?.isHost}
                onEndMeeting={onEndMeeting}
            />

            {/* Participants Panel */}
            {showParticipants && (
                <ParticipantsPanel
                    localUser={currentUser}
                    isMicOn={isMicOn}
                    isCameraOn={isCameraOn}
                    remoteStreams={remoteStreams}
                    onClose={() => setShowParticipants(false)}
                />
            )}

            {/* Modal for when meeting is ended by host */}
            {isMeetingEnded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-950/60 text-2xl text-red-400">
                            🛑
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-white">Meeting Ended</h2>
                        <p className="mt-2 text-sm text-zinc-400">
                            The host has ended this meeting for all participants.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
