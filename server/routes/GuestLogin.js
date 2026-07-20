import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const guestLogin = async (req, res) => {
    const { name } = req.body;

    // Validate the name
    if (!name || !name.trim()) {

        return res.status(400).json({
            error: "Name is required"
        });

    }

    try {
        const jti = crypto.randomUUID();
        console.log("This is jti" + " " + jti);

        const token = jwt.sign(
            {
                jti,
                type: "guest",
                name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "24h"
            }
        );
        console.log("This is the token" + " " + token);

        // Calculate database expiry
        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);

        const result = await pool.query(
            `
            INSERT INTO guest_sessions
            (display_name, jwt_id, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [name.trim(), jti, expiresAt]
        );

        // Send JWT as HttpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            message: "Guest login successful",
            guest: {
                id: result.rows[0].id,
                name: result.rows[0].display_name
            }
        });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};