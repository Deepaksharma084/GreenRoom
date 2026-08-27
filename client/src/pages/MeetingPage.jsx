import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useWebRTC from "/hooks/useWebRTC.js";
import { getCurrentUser } from "/utils/getCurrentUser.js";
import VideoGrid from "../components/VideoGrid.jsx";
import MeetingControls from "../components/MeetingControls.jsx";

export default function MeetingPage() {

    const { roomId } = useParams();
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadUser = async () => {

            const user = await getCurrentUser();

            if (!user) {
                navigate("/login");
                return;
            }

            setCurrentUser(user);
            setLoading(false);
        };

        loadUser();

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
        currentUser
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