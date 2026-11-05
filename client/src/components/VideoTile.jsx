import { useEffect, useRef } from "react";

export default function VideoTile({
    stream,
    muted = false,
    name,
    isMicOn,
    isCameraOn
}) {

    const videoRef = useRef(null);

    useEffect(() => {

        if (!videoRef.current || !stream) {
            return;
        }

        videoRef.current.srcObject = stream;

    }, [stream]);

    return (
        <div className="relative flex h-full min-h-[200px] w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-800">

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className={`h-full w-full object-cover ${isCameraOn ? "" : "hidden"}`}
            />

            {/* Camera-off placeholder */}
            {!isCameraOn && (
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-900 text-3xl font-semibold text-white">
                        {name ? name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <span className="text-sm text-zinc-400">{name || "Unknown"}</span>
                    <span className="text-xs text-zinc-500">Camera Off</span>
                </div>
            )}

            {/* Participant name */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                <span>{name || "Unknown"}</span>
                <span>{isMicOn ? "🎤" : "🔇"}</span>
            </div>

        </div>
    );
}
