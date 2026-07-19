import express from "express";
import pool from "../db.js";

export const guestLogin = async (req, res) => {
    const { name } = req.body;

    // Validate the name
    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }

    // Here you would typically save the guest user to the database
    // For now, we'll just return a success message
    try{
        const result = await pool.query("INSERT INTO guest_sessions (display_name) VALUES ($1) RETURNING *", [name]);
        const guestName = result.rows[0].display_name;
    }catch(err){
        console.error(err.message);
        return res.status(500).json({ error: "Internal server error" });
    }

    res.status(200).json({ message: "Guest login successful", name: guestName });
};