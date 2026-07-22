// Protected routes:
//
// POST /meeting/create
// POST /meeting/join
// GET /auth/me
// POST /auth/logout
// GET /history

import jwt from "jsonwebtoken";
import pool from "../db.js";

const verifyJWT = async (req, res, next) => {
    try {
        // Read cookie
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                error: "Authentication required"
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guest user
        if (decoded.type === "guest") {

            const result = await pool.query(
                `
                SELECT id
                FROM guest_sessions
                WHERE jwt_id = $1
                AND expires_at > NOW()
                `,
                [decoded.jti]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    error: "Guest session expired"
                });
            }
        }

        // Google user
        if (decoded.type === "user") {

            const result = await pool.query(
                `
                SELECT id
                FROM users
                WHERE id = $1
                `,
                [decoded.userId]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    error: "User not found"
                });
            }
        }

        // Attach JWT payload to request
        req.user = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            error: "Invalid or expired token"
        });

    }
};

export default verifyJWT;