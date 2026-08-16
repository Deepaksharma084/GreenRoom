export default function MeetingControls({
    isMicOn,
    onToggleMicrophone
}) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
            <button
                onClick={onToggleMicrophone}
                className={`rounded-full px-6 py-3 font-semibold ${isMicOn
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
            >
                {isMicOn ? "🎤 Mute" : "🔇 Unmute"}
            </button>
        </div>
    );
}