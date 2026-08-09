import { useEffect, useRef } from "react";

export default function VideoTile({ stream, muted = false }) {

    const videoRef = useRef(null);

    useEffect(() => {

        if (!videoRef.current || !stream) {
            return;
        }

        videoRef.current.srcObject = stream;

    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="h-full w-full rounded-xl object-cover"
        />
    );
}