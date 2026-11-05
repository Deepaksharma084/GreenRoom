import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({
    localStream,
    remoteStreams,
    isMicOn,
    isCameraOn,
    currentUser
}) {
    const totalParticipants = (localStream ? 1 : 0) + remoteStreams.length;

    // Responsive grid classes based on participant count
    const getGridClasses = () => {
        if (totalParticipants <= 1) {
            return "grid-cols-1";
        }
        if (totalParticipants === 2) {
            return "grid-cols-1 md:grid-cols-2";
        }
        if (totalParticipants <= 4) {
            return "grid-cols-1 sm:grid-cols-2";
        }
        // 5+ participants
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    };

    return (
        <div
            className={`grid min-h-screen gap-2 bg-black p-2 pb-24 ${getGridClasses()}`}
        >

            {localStream && (
                <VideoTile
                    stream={localStream}
                    name={currentUser?.name || "You"}
                    muted={true}
                    isMicOn={isMicOn}
                    isCameraOn={isCameraOn}
                />
            )}

            {remoteStreams.map((participant) => (
                <VideoTile
                    key={participant.socketId}
                    stream={participant.stream}
                    name={participant.name}
                    isMicOn={participant.isMicOn}
                    isCameraOn={participant.isCameraOn}
                />
            ))}

        </div>
    );
}
