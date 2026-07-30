import express from 'express';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";

dotenv.config();

// Passport will now successfully find process.env variables upon import
import passport from "../config/passport.js";
import pool from '../db.js';
import authRoutes from "../routes/authRoutes.js";
import meetingRoutes from "../routes/meetingRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(passport.initialize());
app.use(cookieParser());

const allowedOrigins = [
    'http://localhost:5173'
];

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

app.get('/', (req, res) => {
    res.status(200).send('Server is alive and running!');
});

app.use(cors(corsOptions));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/meeting", meetingRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});