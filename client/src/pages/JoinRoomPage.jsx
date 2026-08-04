import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinRoomPage() {
    const [roomId, setRoomId] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const navigate = useNavigate();

    const handleJoinMeeting = async (event) => {
        event.preventDefault();

        const trimmedRoomId = roomId.trim();
        if (!trimmedRoomId) {
            setErrorMessage('Room ID is required.');
            return;
        }

        setIsJoining(true);
        setErrorMessage('');

        try {
            const response = await fetch('/meeting/join', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ roomId: trimmedRoomId })
            });

            const data = await response.json();
            if (response.ok) {
                navigate(`/meeting/${data.meeting.roomId}`);
                return;
            }

            setErrorMessage(data?.error || 'Unable to join meeting. Please try again.');
        } catch (error) {
            console.error('Join meeting error:', error);
            setErrorMessage('Unable to join meeting. Please try again.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,243,208,0.85),_rgba(5,46,22,0.95))] px-4 py-10 text-emerald-950">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center gap-8">
                <div className="w-full max-w-xl rounded-[2rem] border border-white/40 bg-white/5 px-8 py-10 shadow-[0_25px_80px_rgba(3,34,20,0.35)] backdrop-blur-xl">
                    <div className="mb-8 text-center">
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-700/80">Join Meeting</p>
                        <h1 className="mt-3 text-4xl font-semibold text-emerald-950 sm:text-5xl">Enter Meeting ID</h1>
                        <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-6 text-emerald-700/60 sm:text-base">
                            Join an existing room quickly using the meeting ID your host shared.
                        </p>
                    </div>

                    <form onSubmit={handleJoinMeeting} className="flex flex-col gap-5">
                        <label className="space-y-3">
                            <span className="block text-sm font-bold text-emerald-900">Room ID</span>
                            <input
                                type="text"
                                placeholder="Enter meeting ID"
                                value={roomId}
                                onChange={(event) => {
                                    setRoomId(event.target.value);
                                    if (errorMessage) {
                                        setErrorMessage('');
                                    }
                                }}
                                className="w-full rounded-3xl border border-emerald-200/80 bg-white/85 px-5 py-4 text-base text-emerald-950 outline-none transition-all duration-300 placeholder:text-emerald-500 focus:border-emerald-400 focus:bg-white"
                            />
                        </label>

                        <p className="text-sm font-semibold text-emerald-700">Example: A7K92P</p>
                        {errorMessage && <p className="text-sm text-red-600">
                            {errorMessage}{errorMessage === 'Authentication required' ? (() => {
                                setTimeout(() => {
                                    navigate("/login");
                                }, 2000);
                                return '';
                            })() : ''}
                        </p>}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="submit"
                                disabled={isJoining}
                                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-950 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                {isJoining ? 'Joining...' : 'Join Room'}
                            </button>
                            <button
                                type="button"
                                onClick={handleGoBack}
                                className="inline-flex w-full items-center justify-center rounded-full border border-white/40 bg-white/15 px-6 py-3 text-base font-semibold text-emerald-950 transition duration-300 hover:-translate-y-0.5 hover:bg-white/25 sm:w-auto"
                            >
                                Back
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
