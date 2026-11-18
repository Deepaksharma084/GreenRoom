import { useEffect, useRef, useState } from "react";

export default function VideoTile({
    stream,
    muted = false,
    name,
    isMicOn,
    isCameraOn,
    isHost = false
}) {
    const videoRef = useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (!videoRef.current || !stream) {
            return;
        }

        videoRef.current.srcObject = stream;
    }, [stream]);

    // Phase 24: Active Speaker Indication using Web Audio API volume analysis
    useEffect(() => {
        if (!stream || !isMicOn) {
            setIsSpeaking(false);
            return;
        }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            setIsSpeaking(false);
            return;
        }

        let audioContext = null;
        let analyser = null;
        let source = null;
        let processor = null;
        let isCancelled = false;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;

            audioContext = new AudioContextClass();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.4;

            source = audioContext.createMediaStreamSource(stream);
            processor = audioContext.createScriptProcessor(2048, 1, 1);

            source.connect(analyser);
            analyser.connect(processor);
            processor.connect(audioContext.destination);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            processor.onaudioprocess = () => {
                if (isCancelled) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                setIsSpeaking(average > 14);
            };
        } catch {
            // Audio context may not initialize before first user gesture
        }

        return () => {
            isCancelled = true;
            if (processor) {
                processor.onaudioprocess = null;
                processor.disconnect();
            }
            if (source) source.disconnect();
            if (analyser) analyser.disconnect();
            if (audioContext && audioContext.state !== "closed") {
                audioContext.close().catch(() => {});
            }
        };
    }, [stream, isMicOn]);

    return (
        <div
            className={`relative flex h-full min-h-[200px] w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-800 transition-all duration-300 ${
                isSpeaking
                    ? "ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.35)]"
                    : "ring-0"
            }`}
        >
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
                    <span className="text-sm font-medium text-zinc-300">{name || "Unknown"}</span>
                    <span className="text-xs text-zinc-500">Camera Off</span>
                </div>
            )}

            {/* Participant name & mic status */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                <span className="font-medium">{name || "Unknown"}</span>
                {isHost && (
                    <span className="rounded-full bg-emerald-900/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        Host
                    </span>
                )}
                <span>
                    {isMicOn ? (
                        <span className={isSpeaking ? "text-emerald-400 animate-pulse font-bold" : ""}>
                            🎤
                        </span>
                    ) : (
                        <span className="text-red-400">🔇</span>
                    )}
                </span>
            </div>
        </div>
    );
}
