import { Server } from "socket.io";
import { predictECG } from "../ai/ai.service.js";

let io = null;
const sessionBuffers = new Map(); // Map<sessionId, { samples: number[], activeInferences: number }>

const isValidSessionId = (sessionId) => {
    return typeof sessionId === "string" && sessionId.trim().length > 0;
};

const isValidSample = (sample) => {
    return typeof sample === "number" && Number.isFinite(sample);
};

const sendError = (socket, message, callback) => {
    const errorPayload = { success: false, error: message };
    socket.emit("ecg:error", errorPayload);
    if (typeof callback === "function") {
        callback(errorPayload);
    }
};

const cleanupSessionState = (sessionId, room) => {
    const state = sessionBuffers.get(sessionId);
    if (!state) return;

    const subscriberCount = io?.sockets?.adapter?.rooms?.get(room)?.size ?? 0;
    if (subscriberCount === 0) {
        // Discard un-inferenced samples when no subscribers remain
        state.samples = [];
        if (state.activeInferences === 0) {
            sessionBuffers.delete(sessionId);
        }
    }
};

export const initSocket = (server) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    io = new Server(server, {
        cors: {
            origin: frontendUrl,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("monitor:start", (data, callback) => {
            if (!isValidSessionId(data?.sessionId)) {
                return sendError(socket, "Invalid or missing sessionId", callback);
            }

            const sessionId = data.sessionId.trim();
            const room = `session:${sessionId}`;

            socket.join(room);

            const ackPayload = { success: true, sessionId };
            if (typeof callback === "function") {
                callback(ackPayload);
            }
        });

        socket.on("monitor:stop", (data, callback) => {
            if (!isValidSessionId(data?.sessionId)) {
                return sendError(socket, "Invalid or missing sessionId", callback);
            }

            const sessionId = data.sessionId.trim();
            const room = `session:${sessionId}`;

            socket.leave(room);

            cleanupSessionState(sessionId, room);

            const ackPayload = { success: true, sessionId };
            if (typeof callback === "function") {
                callback(ackPayload);
            }
        });

        socket.on("ecg:data", (data, callback) => {
            if (!isValidSessionId(data?.sessionId)) {
                return sendError(socket, "Invalid or missing sessionId", callback);
            }

            if (!isValidSample(data?.sample)) {
                return sendError(socket, "Invalid ECG sample", callback);
            }

            const sessionId = data.sessionId.trim();
            const room = `session:${sessionId}`;

            if (!socket.rooms.has(room)) {
                return sendError(socket, "Socket is not subscribed to this session", callback);
            }

            // 1. Immediate real-time visualization broadcast
            const updatePayload = {
                sessionId,
                sample: data.sample,
                timestamp: Date.now()
            };
            io.to(room).emit("ecg:update", updatePayload);

            if (typeof callback === "function") {
                callback({ success: true });
            }

            // 2. Parallel ECG sample accumulation into non-blocking per-session buffer
            if (!sessionBuffers.has(sessionId)) {
                sessionBuffers.set(sessionId, { samples: [], activeInferences: 0 });
            }

            const state = sessionBuffers.get(sessionId);
            state.samples.push(data.sample);

            // 3. Trigger 1000-sample non-overlapping window inference
            if (state.samples.length >= 1000) {
                const windowSamples = state.samples.splice(0, 1000);
                state.activeInferences++;

                predictECG(windowSamples)
                    .then((predictionResult) => {
                        state.activeInferences--;
                        const subscriberCount = io.sockets.adapter.rooms.get(room)?.size ?? 0;
                        if (subscriberCount > 0) {
                            io.to(room).emit("ecg:prediction", {
                                sessionId,
                                ...predictionResult
                            });
                        }
                    })
                    .catch((err) => {
                        state.activeInferences--;
                        console.error(`Prediction error for session ${sessionId}:`, err.message);
                        const subscriberCount = io.sockets.adapter.rooms.get(room)?.size ?? 0;
                        if (subscriberCount > 0) {
                            io.to(room).emit("ecg:error", {
                                success: false,
                                error: "ECG prediction service unavailable"
                            });
                        }
                    })
                    .finally(() => {
                        cleanupSessionState(sessionId, room);
                    });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
            // Check and clean up any empty sessions
            for (const sessionId of sessionBuffers.keys()) {
                const room = `session:${sessionId}`;
                cleanupSessionState(sessionId, room);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized!");
    }
    return io;
};
