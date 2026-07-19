import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config.js';

export default function LoginPage() {
    const [name, setName] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) =>{
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

            if (response.ok && data.name) {
                navigate(`/CreateOrJoinRoomPage?name=${encodeURIComponent(data.name)}`);
            } else {
                console.error('Login error:', data.error || "An error occurred during login");
            }
        } catch (error) {
            console.error('Login error:', error);
        }

    };

    return (
        <div className="flex flex-col gap-18 items-center justify-center min-h-screen bg-red-500">
            <div className="flex flex-col gap-2 items-center justify-center">
                <p>Login as Guest</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <button type="submit">
                        Start
                    </button>
                </form>
            </div>

            <div>
                <p>Login with Google for more features</p>
            </div>
        </div>
    );
}
