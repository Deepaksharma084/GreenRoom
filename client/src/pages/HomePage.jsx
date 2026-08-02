import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
    const [currentUser, setCurrentUser] = useState("Guest");
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    credentials: "include"
                });

                if (!response.ok) {
                    setLoading(false);
                    return;
                }
                console.log(data);
                console.log(data.user);
                const data = await response.json();
                if (data.user === undefined) {
                    setCurrentUser("Guest");
                } else {
                    setCurrentUser(data.user);
                }

            } catch (err) {
                console.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        getCurrentUser();
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

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,243,208,0.85),_rgba(5,46,22,0.95))] px-4 py-10 text-emerald-950">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center gap-8">
                <div className=" w-full max-w-md rounded-[2rem] border border-white/40 px-8 py-10 shadow-[0_25px_80px_rgba(3,34,20,0.35)] backdrop-blur-xl">
                    <div className="mb-6 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700/80">Welcome to GreenRoom</p>
                        <h1 className="mt-2 text-3xl font-semibold text-emerald-950">
                            {currentUser
                                ? `Welcome ${currentUser.name}`
                                : "Welcome Guest"}
                        </h1>

                        <p className="mt-2 text-sm text-emerald-700/80">
                            {currentUser
                                ? "You're ready to create or join a meeting."
                                : "Create a room or join an existing one."}
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <button
                            onClick={handleCreateRoom}
                            className="inline-flex w-full items-center justify-center rounded-full bg-emerald-950 px-6 py-3 text-base font-semibold text-white shadow-[0_20px_50px_rgba(16,185,129,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200/60"
                        >
                            Create Room
                        </button>
                        <button
                            onClick={handleJoinRoom}
                            className="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white/15 px-6 py-3 text-base font-semibold text-emerald-950 shadow-[0_14px_35px_rgba(6,95,70,0.12)] transition duration-300 hover:-translate-y-0.5 hover:bg-white/25 focus:outline-none focus:ring-4 focus:ring-emerald-200/50"
                        >
                            Join Room
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}