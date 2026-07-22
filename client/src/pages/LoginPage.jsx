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
            const response = await fetch(`${API_BASE_URL}/auth/guest`, {
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

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
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

                <div className="w-full max-w-md rounded-[1.5rem] border border-white/30 bg-white/10 p-4 shadow-[0_12px_35px_rgba(3,34,20,0.2)] backdrop-blur-md">
                    <p className="mb-2 text-center text-sm font-medium text-emerald-50/90">
                        Unlock more features with a Google account
                    </p>
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="group flex w-full items-center justify-center gap-3 rounded-full border border-white/30 bg-white/15 px-5 py-3 text-sm font-semibold text-emerald-50/95 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/25"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                            <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.7 2.8-4.1 2.8-7.1 0-.7-.1-1.4-.2-2H12z" />
                            <path fill="#34A853" d="M12 22c2.6 0 4.8-.8 6.4-2.2l-3-2.3c-.8.5-1.8.9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.3v2.6C4.9 19.8 8.2 22 12 22z" />
                            <path fill="#4A90E2" d="M6.4 13.3c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6.7H3.3c-1.1 2-1.1 4.4 0 6.6l3.1-2.0z" />
                            <path fill="#FBBC05" d="M12 6.2c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.7 3.2 14.5 2 12 2 8.2 2 4.9 4.2 3.3 6.7l3.1 2.6c.8-2.4 3-4.1 5.6-4.1z" />
                        </svg>
                        <span>Continue with Google</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
