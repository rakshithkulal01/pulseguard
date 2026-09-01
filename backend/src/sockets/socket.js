import { Server } from "socket.io";

let io = null;

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

            const updatePayload = {
                sessionId,
                sample: data.sample,
                timestamp: Date.now()
            };

            io.to(room).emit("ecg:update", updatePayload);

            if (typeof callback === "function") {
                callback({ success: true });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
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
