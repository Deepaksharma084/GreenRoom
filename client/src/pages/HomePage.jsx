import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "/utils/getCurrentUser.js";

export default function HomePage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getCurrentUser();
                if (user) {
                    setCurrentUser(user);
                }
            } catch (err) {
                console.error("Failed to load user:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleCreateRoom = () => {
        if (currentUser) {
            navigate("/create-room");
        } else {
            navigate("/login");
        }
    };

    const handleJoinRoom = () => {
        if (currentUser) {
            navigate("/join-room");
        } else {
            navigate("/login");
        }
    };

    const handleFetchHistory = async () => {
        if (showHistory) {
            setShowHistory(false);
            return;
        }

        setLoadingHistory(true);
        setShowHistory(true);
        try {
            const res = await fetch("/meeting/history", {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch(`/auth/logout`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }

            setCurrentUser(null);
            navigate("/");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-emerald-950 text-white">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,243,208,0.85),_rgba(5,46,22,0.95))] px-4 py-10 text-emerald-950">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center gap-6">

                {/* Main Action Card */}
                <div className="w-full max-w-md rounded-[2rem] border border-white/40 px-8 py-10 shadow-[0_25px_80px_rgba(3,34,20,0.35)] backdrop-blur-xl">
                    <div className="mb-6 text-center">
                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-700/80">
                            Welcome to GreenRoom
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-emerald-950">
                            {currentUser ? `Welcome ${currentUser.name}` : "Welcome"}
                        </h1>

                        <p className="mt-2 text-sm font-semibold text-emerald-700">
                            {currentUser
                                ? "You're ready to create or join a meeting."
                                : "Create a room or join an existing one."}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <button
                            onClick={handleCreateRoom}
                            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-950 px-6 py-3 text-base font-semibold text-white shadow-[0_20px_50px_rgba(16,185,129,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-900 focus:outline-none"
                        >
                            Create Room
                        </button>
                        <button
                            onClick={handleJoinRoom}
                            className="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white/15 px-6 py-3 text-base font-semibold text-emerald-950 shadow-[0_14px_35px_rgba(6,95,70,0.12)] transition duration-300 hover:-translate-y-0.5 hover:bg-white/25 focus:outline-none"
                        >
                            Join Room
                        </button>
                    </div>

                    {currentUser && (
                        <div className="mt-4">
                            <button
                                onClick={handleFetchHistory}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-800/20 bg-emerald-950/10 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-950/20"
                            >
                                <span>📋</span>
                                <span>{showHistory ? "Hide Meeting History" : "View Meeting History"}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Meeting History Section */}
                {showHistory && (
                    <div className="w-full max-w-xl rounded-[1.5rem] border border-white/40 bg-white/20 p-6 shadow-xl backdrop-blur-xl">
                        <h3 className="mb-4 text-base font-bold text-emerald-950">
                            Past Meetings
                        </h3>

                        {loadingHistory ? (
                            <p className="text-center text-sm text-emerald-800">Loading history...</p>
                        ) : history.length === 0 ? (
                            <p className="text-center text-sm text-emerald-800">No meeting history found.</p>
                        ) : (
                            <div className="flex max-h-64 flex-col gap-2.5 overflow-y-auto pr-1">
                                {history.map((m, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-xl border border-white/30 bg-white/40 px-4 py-3 text-xs"
                                    >
                                        <div>
                                            <p className="font-semibold text-emerald-950">
                                                {m.room_name} <span className="text-emerald-700">({m.room_id})</span>
                                            </p>
                                            <p className="text-emerald-800">
                                                Joined: {new Date(m.joined_at).toLocaleString()}
                                                {m.duration_seconds ? ` • Duration: ${Math.floor(m.duration_seconds / 60) > 0 ? `${Math.floor(m.duration_seconds / 60)}m ` : ""}${m.duration_seconds % 60}s` : ""}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`rounded-full px-2 py-0.5 font-medium ${
                                                    m.status === "ACTIVE"
                                                        ? "bg-emerald-700 text-white"
                                                        : "bg-zinc-600 text-white"
                                                }`}
                                            >
                                                {m.status}
                                            </span>
                                            {m.is_host && (
                                                <span className="ml-1 rounded-full bg-emerald-900/60 px-2 py-0.5 font-medium text-emerald-950">
                                                    Host
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Logout Button */}
                {currentUser && (
                    <div className="w-full max-w-md rounded-[1.5rem] border border-white/30 p-3 shadow-lg backdrop-blur-xl">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="group flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition-all hover:bg-white/25"
                        >
                            <span>🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
