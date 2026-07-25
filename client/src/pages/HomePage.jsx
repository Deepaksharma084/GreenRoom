import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function CreateOrJoinRoomPage() {

    const [currentUser, setCurrentUser] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {

        const getCurrentUser = async () => {

            try {

                const response = await fetch(
                    `${API_BASE_URL}/auth/me`,
                    {
                        credentials: "include"
                    }
                );

                if (!response.ok) {
                    navigate("/login");
                    return;
                }

                const data = await response.json();

                setCurrentUser(data.user);

            } catch (err) {

                console.error(err);

            }

        };

        getCurrentUser();

    }, [navigate]);

    return (
        <div>
            <h1>
                Welcome, {currentUser ? currentUser.name : "Guest"} 👋
            </h1>

            <button>Create Room</button>

            <button>Join Room</button>
        </div>
    );
}