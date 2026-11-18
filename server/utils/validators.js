export const isValidRoomId = (roomId) => {
    if (typeof roomId !== "string") return false;
    const trimmed = roomId.trim().toUpperCase();
    // 4 to 10 characters, alphanumeric only
    return /^[A-Z0-9]{4,10}$/.test(trimmed);
};

export const sanitizeString = (str, maxLength = 100) => {
    if (typeof str !== "string") return "";
    return str
        .trim()
        .replace(/[<>]/g, "") // basic XSS defense against HTML injection
        .slice(0, maxLength);
};
