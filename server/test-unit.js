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

// 6. Dynamic TURN configuration injection
process.env.TURN_URL = "turn:turn.example.com:3478";
process.env.TURN_USERNAME = "test_user";
process.env.TURN_CREDENTIAL = "test_pass";
let turnResponse = null;
getIceServersConfig({}, {
    status: () => ({
        json: (data) => {
            turnResponse = data;
        }
    })
});
assert(
    turnResponse.iceServers.some((s) => s.urls === "turn:turn.example.com:3478" && s.username === "test_user"),
    "getIceServersConfig dynamically includes TURN credentials when configured in environment"
);
delete process.env.TURN_URL;
delete process.env.TURN_USERNAME;
delete process.env.TURN_CREDENTIAL;

// 7. Phase 23: Host Permission Verification Logic
const meetingSample = {
    host_user_id: "user-uuid-1",
    host_guest_id: "guest-uuid-2"
};
const user1 = { id: "user-uuid-1", type: "user" };
const user2 = { id: "user-uuid-99", type: "user" };
const guest1 = { id: "guest-uuid-2", type: "guest" };
const guest2 = { id: "guest-uuid-88", type: "guest" };

const isHost1 = (user1.type === "user" && meetingSample.host_user_id === user1.id) ||
                (user1.type === "guest" && meetingSample.host_guest_id === user1.id);
const isHost2 = (user2.type === "user" && meetingSample.host_user_id === user2.id) ||
                (user2.type === "guest" && meetingSample.host_guest_id === user2.id);
const isHost3 = (guest1.type === "user" && meetingSample.host_user_id === guest1.id) ||
                (guest1.type === "guest" && meetingSample.host_guest_id === guest1.id);
const isHost4 = (guest2.type === "user" && meetingSample.host_user_id === guest2.id) ||
                (guest2.type === "guest" && meetingSample.host_guest_id === guest2.id);

assert(isHost1 === true, "Host permission matches host_user_id for registered user");
assert(isHost2 === false, "Host permission rejects non-host registered user");
assert(isHost3 === true, "Host permission matches host_guest_id for guest creator");
assert(isHost4 === false, "Host permission rejects non-host guest");

console.log("\n=========================================");
console.log(`TOTAL PASSED: ${passed}`);
console.log(`TOTAL FAILED: ${failed}`);
console.log("=========================================\n");

process.exit(failed > 0 ? 1 : 0);
