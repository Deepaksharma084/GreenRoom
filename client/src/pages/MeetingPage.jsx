import { useParams } from "react-router-dom";
import useWebRTC from "/hooks/useWebRTC.js";
import VideoGrid from "../components/VideoGrid.jsx";

export default function MeetingPage() {

    const { roomId } = useParams();

    const {
        localStream,
        remoteStreams
    } = useWebRTC(roomId);

    return (
        <div className="min-h-screen bg-black">

            <VideoGrid
                localStream={localStream}
                remoteStreams={remoteStreams}
            />

        </div>
    );
}