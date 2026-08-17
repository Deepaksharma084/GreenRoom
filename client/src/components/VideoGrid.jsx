import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({
    localStream,
    remoteStreams,
    isMicOn
}) {
    return (
        <div className="grid min-h-screen grid-cols-1 gap-4 bg-black p-4 md:grid-cols-2">

            {localStream && (
                <VideoTile
                    stream={localStream}
                    muted={true}
                    isMicOn={isMicOn}
                />
            )}

            {remoteStreams.map((participant) => (
                <VideoTile
                    key={participant.socketId}
                    stream={participant.stream}
                    isMicOn={participant.isMicOn}
                />
            ))}

        </div>
    );
}