import express from "express";

export const testRouter = (req, res) => {
    res.status(200).json({ message: "Test route is working!" });
}