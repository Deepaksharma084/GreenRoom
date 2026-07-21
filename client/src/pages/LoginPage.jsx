import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config.js';

export default function LoginPage() {
    const [name, setName] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            alert("Please enter your name.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/guest-login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: 'include',
                body: JSON.stringify({ name: trimmedName }),
            });

            const data = await response.json();
            console.log("This is the data" + " " + JSON.stringify(data));
            if (response.ok && data.guest.name) {
                navigate(`/CreateOrJoinRoomPage?name=${encodeURIComponent(data.guest.name)}`);
            } else {
                console.error('Login error:', data.error || "An error occurred during login");
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(167,243,208,0.85),_rgba(5,46,22,0.95))] px-4 py-10 text-emerald-950">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center gap-8">
                <div className="glassy-panel w-full max-w-md rounded-[2rem] border border-white/40 px-8 py-10 shadow-[0_25px_80px_rgba(3,34,20,0.35)] backdrop-blur-xl">
                    <div className="mb-6 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700/80">Welcome</p>
                        <h1 className="mt-2 text-3xl font-semibold text-emerald-950">Login as Guest</h1>
                        <p className="mt-2 text-sm text-emerald-700/80">Jump in quickly and start your meeting experience.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-full border border-emerald-200/80 bg-white/80 px-5 py-3 text-base text-emerald-950 outline-none transition-all duration-300 placeholder:text-emerald-700/60 focus:border-emerald-400 focus:bg-white"
                        />

                        <button
                            type="submit"
                            className="glassy-button group relative overflow-hidden rounded-full bg-emerald-950 px-5 py-3 font-semibold text-emerald-50 shadow-lg shadow-emerald-900/30"
                        >
                            <span className="relative z-10 inline-block transition-transform duration-300 group-hover:-translate-y-0.5">
                                Start
                            </span>
                        </button>
                    </form>
                </div>

                <div className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-emerald-50/90 backdrop-blur-md">
                    Login with Google for more features
                </div>
            </div>
        </div>
    );
}
