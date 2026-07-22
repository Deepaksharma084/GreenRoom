import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const guestLogin = async (req, res) => {
    const { name } = req.body;

    const displayName = name.trim();
    // Validate the name
    if (!name || !displayName) {

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
                name: displayName
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
            [displayName, jti, expiresAt]
        );

        // Send JWT as HttpOnly cookie
        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none", // Allows cross-site cookie sharing for development and production
            maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
            path: "/" //Sends this cookie on every request to website.
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

export const googleCallback = async (req, res) => {
    try {

        const {
            id: googleId,
            displayName,
            emails,
            photos
        } = req.user;

        const email = emails[0].value;
        const avatarUrl = photos[0].value;

        const existingUser = await pool.query(
            `
            SELECT *
            FROM users
            WHERE google_id = $1
            `,
            [googleId]
        );

        let user;

        if (existingUser.rows.length === 0) {

            const newUser = await pool.query(
                `
                INSERT INTO users
                (google_id, name, email, avatar_url)
                VALUES ($1, $2, $3, $4)
                RETURNING *
                `,
                [
                    googleId,
                    displayName,
                    email,
                    avatarUrl
                ]
            );

            user = newUser.rows[0];

        } else {

            user = existingUser.rows[0];

        }

        const token = jwt.sign(
            {
                type: "user",
                userId: user.id,
                name: user.name,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/"
        });

        return res.redirect(process.env.CLIENT_URL);

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            error: "Internal server error"
        });

    }
};

export const logout = async (req, res) => {

}

export const getCurrentUser = async (req, res) => {

}