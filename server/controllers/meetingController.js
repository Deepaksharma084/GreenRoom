import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { generateRoomID } from "../utils/generateRoomID.js";

export const createMeeting = async (req, res) => {
    const { title } = req.body;

    const roomName = title.trim();

    if (!roomName) {
        return res.status(400).json({
            error: "Room name is required"
        });
    }
    const host_user_id = ""
    const host_guest_id = ""

    if (req.user.type === "user") {
        host_user_id = req.user.userId
        host_guest_id = null
    }

    if (req.user.type === "guest") {
        host_guest_id = req.user.guestId
        host_user_id = null
    }

    const roomID = await generateRoomID()

    try {
        const result = await pool.query(
            `INSERT INTO meetings (room_id, room_name,  host_user_id, host_guest_id) VALUES ($1, $2, $3, $4) RETURNING *`,
            [roomID, title, host_user_id, host_guest_id]
        );
        const historyResult = await pool.query(
            `INSERT INTO meeting_history .........`
        );
        return res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.log("internal server error while creating room" + err.message);
        return res.status(500).json({
            error: "Internal server error while creating room"
        });
    }
}