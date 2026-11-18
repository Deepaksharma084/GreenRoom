let cachedIceServers = null;

export const getIceServers = async () => {
    if (cachedIceServers) {
        return cachedIceServers;
    }

    try {
        const response = await fetch("/meeting/ice-servers", {
            credentials: "include"
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
                cachedIceServers = data.iceServers;
                return cachedIceServers;
            }
        }
    } catch (err) {
        console.warn("Could not retrieve server ICE configuration, using default STUN:", err.message);
    }

    // Default public STUN fallback
    return [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ];
};
