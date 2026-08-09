import VideoTile from "./VideoTile.jsx";

export default function VideoGrid({
    localStream,
    remoteStreams
}) {

    return (
        <div className="grid min-h-screen grid-cols-1 gap-4 bg-black p-4 md:grid-cols-2">

            {/* Local video */}
            {localStream && (
                <VideoTile
                    stream={localStream}
                    muted={true}
                />
            )}

            {/* Remote videos */}
            {remoteStreams.map((stream, index) => (
                <VideoTile
                    key={index}
                    stream={stream}
                />
            ))}

        </div>
    );
}