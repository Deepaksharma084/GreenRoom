import crypto from "crypto";

export function generateRoomID() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let roomId = "";

    for (let i = 0; i < 6; i++) {
        roomId += characters[crypto.randomInt(characters.length)];
    }

    return roomId;
}