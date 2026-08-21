import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({
    localStream,
    remoteStreams,
    isMicOn,
    isCameraOn
}) {
    return (
        <div className="grid min-h-screen grid-cols-1 gap-4 bg-black p-4 md:grid-cols-2">

            {localStream && (
                <VideoTile
                    stream={localStream}
                    name={currentUser.name}
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