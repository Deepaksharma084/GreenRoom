import express from 'express';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

import { initializeSocket } from "../socket/socketServer.js";
import passport from "../config/passport.js";
import authRoutes from "../routes/authRoutes.js";
import meetingRoutes from "../routes/meetingRoutes.js";
import { createRateLimiter } from "../middleware/rateLimiter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://192.168.1.6:5173',
    process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires']
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Phase 27: Rate limiting against DDoS and brute-force
const apiLimiter = createRateLimiter({
    windowMs: 60000,
    max: 120,
    message: "Too many requests. Please slow down."
});
app.use(apiLimiter);

app.get('/', (req, res) => {
    res.status(200).send('Server is alive and running!');
});

app.use("/auth", authRoutes);
app.use("/meeting", meetingRoutes);

// Http server and socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Initialize socket.io
initializeSocket(io);
app.set("io", io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
