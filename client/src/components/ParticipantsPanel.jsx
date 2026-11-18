export default function ParticipantsPanel({
    localUser,
    isMicOn,
    isCameraOn,
    remoteStreams,
    onClose,
    isLocalHost = false
}) {
    return (
        <div className="fixed top-0 right-0 z-50 flex h-full w-80 flex-col border-l border-zinc-700 bg-zinc-900 text-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-4">
                <h2 className="text-lg font-semibold">
                    Participants ({1 + remoteStreams.length})
                </h2>
                <button
                    onClick={onClose}
                    className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
                    aria-label="Close participants panel"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">

                {/* Local user */}
                <div className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold">
                            {localUser?.name
                                ? localUser.name.charAt(0).toUpperCase()
                                : "?"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {localUser?.name || "You"} (You)
                            </span>
                            {isLocalHost && (
                                <span className="w-fit rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                    Host
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                        <span title={isMicOn ? "Mic on" : "Mic off"}>
                            {isMicOn ? "🎤" : "🔇"}
                        </span>
                        <span title={isCameraOn ? "Camera on" : "Camera off"}>
                            {isCameraOn ? "📹" : "📹❌"}
                        </span>
                    </div>
                </div>

                {/* Remote participants */}
                {remoteStreams.map((participant) => (
                    <div
                        key={participant.socketId}
                        className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-zinc-800"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-600 text-sm font-semibold">
                                {participant.name
                                    ? participant.name.charAt(0).toUpperCase()
                                    : "?"}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {participant.name || "Unknown"}
                                </span>
                                {participant.isHost && (
                                    <span className="w-fit rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                        Host
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                            <span title={participant.isMicOn ? "Mic on" : "Mic off"}>
                                {participant.isMicOn ? "🎤" : "🔇"}
                            </span>
                            <span title={participant.isCameraOn ? "Camera on" : "Camera off"}>
                                {participant.isCameraOn ? "📹" : "📹❌"}
                            </span>
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}
