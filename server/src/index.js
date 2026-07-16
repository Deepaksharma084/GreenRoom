import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from 'url';

import { testRouter } from '../routes/Login.js';

// Setup __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to the MOngoDB")
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    })

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
}); // Health check endpoint for server in uptimeRobot

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/test', testRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});