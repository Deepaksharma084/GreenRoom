import { useEffect, useRef } from "react";

export default function VideoTile({
    stream,
    muted = false,
    isMicOn
}) {

    const videoRef = useRef(null);

    useEffect(() => {

        if (!videoRef.current || !stream) {
            return;
        }

        videoRef.current.srcObject = stream;

    }, [stream]);

    return (
        <div className="relative h-full w-full">

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="h-full w-full rounded-xl object-cover"
            />

            <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-2 text-lg">
                {isMicOn ? "🎤" : "🔇"}
            </div>

        </div>
    );
}