import jwt from "jsonwebtoken";
import { isValidRoomId, sanitizeString } from "./utils/validators.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";
import { getIceServersConfig } from "./controllers/meetingController.js";

console.log("=========================================");
console.log("   GREENROOM SECURITY & UNIT TESTS       ");
console.log("=========================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${testName}`);
        failed++;
    }
}

// 1. Validator: Room ID
assert(isValidRoomId("ABC123") === true, "isValidRoomId accepts valid 6-char alphanumeric ID");
assert(isValidRoomId("A7K92P") === true, "isValidRoomId accepts uppercase alphanumeric room ID");
assert(isValidRoomId("ab") === false, "isValidRoomId rejects IDs shorter than 4 chars");
assert(isValidRoomId("ABCDEF123456") === false, "isValidRoomId rejects IDs longer than 10 chars");
assert(isValidRoomId("ABC-12") === false, "isValidRoomId rejects special characters");
assert(isValidRoomId("'; DROP TABLE meetings; --") === false, "isValidRoomId rejects SQL injection payloads");
assert(isValidRoomId(null) === false, "isValidRoomId handles null safely");
assert(isValidRoomId(123456) === false, "isValidRoomId handles numbers safely");

// 2. Validator: Sanitizer
assert(sanitizeString("  Sprint Planning  ") === "Sprint Planning", "sanitizeString trims whitespace");
assert(sanitizeString("<script>alert('xss')</script>Meeting") === "scriptalert('xss')/scriptMeeting", "sanitizeString strips HTML/XSS tag delimiters");
assert(sanitizeString("A".repeat(150), 50).length === 50, "sanitizeString enforces max length");

// 3. Rate Limiter Middleware
const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
let req1 = { ip: "127.0.0.1", headers: {}, socket: {} };
let req2 = { ip: "127.0.0.1", headers: {}, socket: {} };
let req3 = { ip: "127.0.0.1", headers: {}, socket: {} };

let status1 = null, status2 = null, status3 = null;
let resMock = {
    status: (code) => ({
        json: (data) => {
            return code;
        }
    })
};

limiter(req1, resMock, () => { status1 = 200; });
limiter(req2, resMock, () => { status2 = 200; });
let res3 = {
    status: (code) => {
        status3 = code;
        return { json: () => {} };
    }
};
limiter(req3, res3, () => {});

assert(status1 === 200, "Rate limiter permits 1st request");
assert(status2 === 200, "Rate limiter permits 2nd request");
assert(status3 === 429, "Rate limiter blocks 3rd request with 429 Too Many Requests");

// 4. JWT Expiration & Sign/Verify
const secret = "test_jwt_secret_key_123";
const token = jwt.sign({ type: "guest", jti: "12345-uuid", name: "Deepak" }, secret, { expiresIn: "1s" });
const decoded = jwt.verify(token, secret);
assert(decoded.name === "Deepak" && decoded.type === "guest", "JWT generates and verifies correctly with payload");

// 5. ICE Server Controller (TURN & STUN)
let iceResponse = null;
const mockRes = {
    status: (code) => ({
        json: (data) => {
            iceResponse = data;
        }
    })
};
getIceServersConfig({}, mockRes);
assert(
    Array.isArray(iceResponse?.iceServers) &&
    iceResponse.iceServers.some((s) => s.urls.includes("stun")),
    "getIceServersConfig returns secure array with STUN fallback"
);

console.log("\n=========================================");
console.log(`TOTAL PASSED: ${passed}`);
console.log(`TOTAL FAILED: ${failed}`);
console.log("=========================================\n");

process.exit(failed > 0 ? 1 : 0);
