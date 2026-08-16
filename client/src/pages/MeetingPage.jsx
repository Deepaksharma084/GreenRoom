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
        toggleMicrophone
    } = useWebRTC(roomId);

    useEffect(() => {

    }, []);

    return (
        <div className="min-h-screen bg-black">
            <VideoGrid
                localStream={localStream}
                remoteStreams={remoteStreams}
            />
            <MeetingControls
                isMicOn={isMicOn}
                onToggleMicrophone={toggleMicrophone}
            />

        </div>
    );
}