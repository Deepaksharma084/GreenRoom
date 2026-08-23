import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config.js";
import useWebRTC from "/hooks/useWebRTC.js";
import VideoGrid from "../components/VideoGrid.jsx";
import MeetingControls from "../components/MeetingControls.jsx";

export default function MeetingPage() {

    const { roomId } = useParams();
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get current authenticated user
    useEffect(() => {

        const getCurrentUser = async () => {

            try {

                const response = await fetch(
                    `${API_BASE_URL}/auth/me`,
                    {
                        credentials: "include"
                    }
                );

                if (!response.ok) {
                    navigate("/login");
                    return;
                }

                const data = await response.json();

                setCurrentUser(data.user);

            } catch (error) {

                console.error(
                    "Failed to get current user:",
                    error
                );

                navigate("/login");

            } finally {

                setLoading(false);

            }
        };

        getCurrentUser();

    }, [navigate]);


    // Don't start WebRTC until currentUser exists
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white">
                Loading...
            </div>
        );
    }

    if (!currentUser) {
        return null;
    }

    return (
        <MeetingContent
            roomId={roomId}
            currentUser={currentUser}
        />
    );
}


function MeetingContent({ roomId, currentUser }) {

    const {
        localStream,
        remoteStreams,
        isMicOn,
        toggleMicrophone,
        isCameraOn,
        toggleCamera
    } = useWebRTC(
        roomId,
        currentUser.name
    );

    return (
        <div className="min-h-screen bg-black">

            <VideoGrid
                localStream={localStream}
                remoteStreams={remoteStreams}
                isMicOn={isMicOn}
                isCameraOn={isCameraOn}
            />

            <MeetingControls
                isMicOn={isMicOn}
                onToggleMicrophone={toggleMicrophone}
                isCameraOn={isCameraOn}
                onToggleCamera={toggleCamera}
            />

        </div>
    );
}