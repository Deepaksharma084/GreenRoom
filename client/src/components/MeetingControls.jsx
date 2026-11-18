import { useState } from "react";

export default function MeetingControls({
    isMicOn,
    onToggleMicrophone,
    isCameraOn,
    onToggleCamera,
    isScreenSharing,
    onStartScreenShare,
    onStopScreenShare,
    onToggleParticipants,
    participantCount,
    onLeave,
    isHost = false,
    onEndMeeting
}) {
    const [showConfirmEnd, setShowConfirmEnd] = useState(false);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 bg-zinc-900/90 px-4 py-4 backdrop-blur-sm sm:gap-4">

            {/* Microphone */}
            <button
                onClick={onToggleMicrophone}
                title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition sm:h-14 sm:w-14 ${
                    isMicOn
                        ? "bg-zinc-700 text-white hover:bg-zinc-600"
                        : "bg-red-600 text-white hover:bg-red-500"
                }`}
            >
                {isMicOn ? "🎤" : "🔇"}
            </button>

            {/* Camera */}
            <button
                onClick={onToggleCamera}
                title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition sm:h-14 sm:w-14 ${
                    isCameraOn
                        ? "bg-zinc-700 text-white hover:bg-zinc-600"
                        : "bg-red-600 text-white hover:bg-red-500"
                }`}
            >
                {isCameraOn ? "📹" : "📹 Off"}
            </button>

            {/* Screen Share */}
            <button
                onClick={isScreenSharing ? onStopScreenShare : onStartScreenShare}
                title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition sm:h-14 sm:w-14 ${
                    isScreenSharing
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
            >
                🖥️
            </button>

            {/* Participants */}
            <button
                onClick={onToggleParticipants}
                title="Participants"
                className="relative flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-lg text-white transition hover:bg-zinc-600 sm:h-14 sm:w-14"
            >
                👥
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {participantCount}
                </span>
            </button>

            {/* Leave button */}
            <button
                onClick={onLeave}
                title="Leave meeting"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-lg text-white transition hover:bg-zinc-600 sm:h-14 sm:w-14"
            >
                🚪
            </button>

            {/* Phase 22 & 23: Host End Meeting for Everyone */}
            {isHost && (
                <div className="relative">
                    <button
                        onClick={() => setShowConfirmEnd((prev) => !prev)}
                        title="End meeting for everyone"
                        className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500 sm:h-14 sm:px-5"
                    >
                        <span>End for All</span>
                    </button>

                    {showConfirmEnd && (
                        <div className="absolute bottom-16 right-0 w-64 rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-white shadow-2xl">
                            <p className="text-xs text-zinc-300">
                                End this meeting for all participants?
                            </p>
                            <div className="mt-3 flex justify-end gap-2">
                                <button
                                    onClick={() => setShowConfirmEnd(false)}
                                    className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmEnd(false);
                                        if (onEndMeeting) onEndMeeting();
                                    }}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                                >
                                    Confirm End
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
