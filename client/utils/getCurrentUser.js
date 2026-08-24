import { API_BASE_URL } from "../config.js";

export const getCurrentUser = async () => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/auth/me`,
            {
                credentials: "include"
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return data.user;

    } catch (error) {

        console.error(
            "Failed to get current user:",
            error
        );

        return null;
    }
};