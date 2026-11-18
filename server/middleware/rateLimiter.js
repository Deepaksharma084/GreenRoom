export const createRateLimiter = ({
    windowMs = 60000,
    max = 60,
    message = "Too many requests, please try again later."
} = {}) => {
    const hits = new Map();

    // Clean up expired entries every window cycle
    const timer = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of hits.entries()) {
            if (now - record.startTime > windowMs) {
                hits.delete(key);
            }
        }
    }, windowMs);

    if (timer.unref) {
        timer.unref();
    }

    return (req, res, next) => {
        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
        const now = Date.now();
        const record = hits.get(ip) || { count: 0, startTime: now };

        if (now - record.startTime > windowMs) {
            record.count = 1;
            record.startTime = now;
        } else {
            record.count += 1;
        }

        hits.set(ip, record);

        if (record.count > max) {
            return res.status(429).json({ error: message });
        }

        next();
    };
};
