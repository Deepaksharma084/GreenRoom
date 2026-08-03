import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateRoomPage() {
    const [roomName, setRoomName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    const handleCreateRoom = async (event) => {
        event.preventDefault();

        const trimmedRoomName = roomName.trim();
        if (!trimmedRoomName) {
            setErrorMessage('Room name is required.');
            return;
        }

        setIsCreating(true);
        setErrorMessage('');

        try {
            const response = await fetch('/meeting/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: trimmedRoomName })
            });

            const data = await response.json();
            if (response.ok) {
                navigate(`/meeting/${data.meeting.roomId}`);
                return;
            }

            setErrorMessage(data?.error || 'Unable to create room. Please try again.');
        } catch (error) {
            console.error('Create room error:', error);
            setErrorMessage('Unable to create room. Please try again.');
        } finally {
            setIsCreating(false);
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
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-700/80">Create Room</p>
                        <h1 className="mt-3 text-4xl font-semibold text-emerald-950 sm:text-5xl">Create New Meeting</h1>
                        <p className="mx-auto mt-4 max-w-2xl text-sm font-bold leading-6 text-emerald-700/60 sm:text-base">
                            Create a room and invite others with a secure room ID.
                        </p>
                    </div>

                    <form onSubmit={handleCreateRoom} className="flex flex-col gap-5">
                        <label className="space-y-3">
                            <span className="block text-sm font-bold text-emerald-900">Room Name</span>
                            <input
                                type="text"
                                placeholder="Enter meeting title"
                                value={roomName}
                                onChange={(event) => {
                                    setRoomName(event.target.value);
                                    if (errorMessage) {
                                        setErrorMessage('');
                                    }
                                }}
                                className="w-full rounded-3xl border border-emerald-200/80 bg-white/85 px-5 py-4 text-base text-emerald-950 outline-none transition-all duration-300 placeholder:text-emerald-500 focus:border-emerald-400 focus:bg-white"
                            />
                        </label>

                        <p className="text-sm font-bold text-emerald-700">Example: Weekly Team Sync</p>
                        {errorMessage}{errorMessage === 'Authentication required' ? (() => {
                            setTimeout(() => {
                                navigate("/login");
                            }, 2000);
                            return '';
                        })() : ''}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-950 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                            >
                                {isCreating ? 'Creating...' : 'Create Room'}
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
