import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({
    localStream,
    remoteStreams
}) {
    return (
        <div className="grid min-h-screen grid-cols-1 gap-4 bg-black p-4 md:grid-cols-2">

            {localStream && (
                <VideoTile
                    stream={localStream}
                    muted={true}
                />
            )}

            {remoteStreams.map((remote) => (
                <VideoTile
                    key={remote.socketId}
                    stream={remote.stream}
                />
            ))}

        </div>
    );
}