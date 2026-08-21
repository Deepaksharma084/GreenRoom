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
        <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-900">

            {isCameraOn ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-900 text-3xl font-semibold text-white">
                        ?
                    </div>
                </div>
            )}

            <div className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-2 text-lg text-white">
                {name}
            </div>

            <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-2 text-sm text-white">
                {isCameraOn ? "📹" : "📹 Off"}
            </div>

            <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-2 text-lg">
                {isMicOn ? "🎤" : "🔇"}
            </div>

        </div>
    );
}