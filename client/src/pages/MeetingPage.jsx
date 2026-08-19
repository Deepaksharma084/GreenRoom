import { useParams } from "react-router-dom";
import { useEffect } from "react";
import useWebRTC from "/hooks/useWebRTC.js";
import VideoGrid from "../components/VideoGrid.jsx";
import MeetingControls from "../components/MeetingControls";

export default function MeetingPage() {
    const { roomId } = useParams();

    const {
        localStream,
        remoteStreams,
        isMicOn,
        toggleMicrophone,
        isCameraOn,
        toggleCamera
    } = useWebRTC(roomId);

    useEffect(() => {

    }, []);

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