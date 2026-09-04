import { Server } from "socket.io";
import { predictECG } from "../ai/ai.service.js";
import { saveSocketPredictionService } from "../services/ecg.service.js";

let io = null;

const sessionBuffers = new Map();
// Map<sessionId, { samples: number[], activeInferences: number }>

// USB demo mode
let activeSerialSessionId = null;

const isValidSessionId = (sessionId) => {
    return (
        typeof sessionId === "string" &&
        sessionId.trim().length > 0
    );
};

const isValidSample = (sample) => {
    return (
        typeof sample === "number" &&
        Number.isFinite(sample)
    );
};

const sendError = (socket, message, callback) => {
    const errorPayload = {
        success: false,
        error: message
    };

    socket.emit("ecg:error", errorPayload);

    if (typeof callback === "function") {
        callback(errorPayload);
    }
};

const cleanupSessionState = (sessionId, room) => {
    const state = sessionBuffers.get(sessionId);

    if (!state) {
        return;
    }

    const subscriberCount =
        io?.sockets?.adapter?.rooms?.get(room)?.size ?? 0;

    if (subscriberCount === 0) {
        // Discard samples that have not yet been processed.
        state.samples = [];

        if (state.activeInferences === 0) {
            sessionBuffers.delete(sessionId);
        }
    }
};

/**
 * Process one ECG sample.
 *
 * This function is shared by:
 * 1. Frontend Socket.IO clients
 * 2. Arduino USB serial input
 */
const processECGSample = (sessionId, sample) => {
    if (!io) {
        console.error("Socket.IO has not been initialized.");
        return;
    }

    if (!isValidSessionId(sessionId)) {
        console.error("Invalid sessionId for ECG sample.");
        return;
    }

    if (!isValidSample(sample)) {
        console.error("Invalid ECG sample received.");
        return;
    }

    const normalizedSessionId = sessionId.trim();
    const room = `session:${normalizedSessionId}`;

    /*
     * 1. Immediately broadcast the ECG sample
     *    for real-time frontend visualization.
     */
    const updatePayload = {
        sessionId: normalizedSessionId,
        sample,
        timestamp: Date.now()
    };

    io.to(room).emit("ecg:update", updatePayload);

    /*
     * 2. Create a buffer for this session if necessary.
     */
    if (!sessionBuffers.has(normalizedSessionId)) {
        sessionBuffers.set(normalizedSessionId, {
            samples: [],
            activeInferences: 0
        });
    }

    const state = sessionBuffers.get(normalizedSessionId);

    /*
     * 3. Add the ECG sample to the session buffer.
     */
    state.samples.push(sample);

    /*
     * 4. When 1000 samples are available,
     *    start a non-blocking inference.
     */
    if (state.samples.length >= 1000) {
        /*
         * Remove exactly one 1000-sample window.
         *
         * This immediately makes the buffer available
         * for the next ECG window.
         */
        const windowSamples = state.samples.splice(0, 1000);

        state.activeInferences++;

        predictECG(windowSamples)
            .then(async (predictionResult) => {
                state.activeInferences--;

                // Persist prediction and generate PDF report in background
                saveSocketPredictionService(
                    normalizedSessionId,
                    windowSamples,
                    predictionResult
                );

                const subscriberCount =
                    io.sockets.adapter.rooms.get(room)?.size ?? 0;

                /*
                 * Don't send stale predictions if everyone
                 * has already stopped monitoring.
                 */
                if (subscriberCount > 0) {
                    io.to(room).emit("ecg:prediction", {
                        sessionId: normalizedSessionId,
                        ...predictionResult
                    });
                }
            })
            .catch((error) => {
                state.activeInferences--;

                console.error(
                    `Prediction error for session ${normalizedSessionId}:`,
                    error.message
                );

                const subscriberCount =
                    io.sockets.adapter.rooms.get(room)?.size ?? 0;

                if (subscriberCount > 0) {
                    io.to(room).emit("ecg:error", {
                        success: false,
                        error: "ECG prediction service unavailable"
                    });
                }
            })
            .finally(() => {
                cleanupSessionState(
                    normalizedSessionId,
                    room
                );
            });
    }
};

/**
 * USB DEMO MODE
 *
 * Sets the session that should receive Arduino ECG samples.
 */
export const setSerialSession = (sessionId) => {
    if (!isValidSessionId(sessionId)) {
        console.error(
            "Cannot activate USB demo mode: invalid sessionId."
        );

        return false;
    }

    activeSerialSessionId = sessionId.trim();

    console.log(
        `USB ECG demo mode active for session: ${activeSerialSessionId}`
    );

    return true;
};

/**
 * Clears the active Arduino USB session.
 */
export const clearSerialSession = (sessionId = null) => {
    if (
        sessionId === null ||
        activeSerialSessionId === sessionId
    ) {
        console.log(
            `USB ECG demo mode stopped for session: ${activeSerialSessionId}`
        );

        activeSerialSessionId = null;
    }
};

/**
 * Receives an ECG sample from Arduino USB serial.
 */
export const processSerialSample = (sample) => {
    if (!activeSerialSessionId) {
        /*
         * Arduino may continue sending data even when
         * no monitoring session is active.
         *
         * Ignore those samples.
         */
        return;
    }

    const room = `session:${activeSerialSessionId}`;

    const subscriberCount =
        io?.sockets?.adapter?.rooms?.get(room)?.size ?? 0;

    /*
     * No frontend is monitoring this session.
     * Don't process Arduino data.
     */
    if (subscriberCount === 0) {
        return;
    }

    processECGSample(
        activeSerialSessionId,
        sample
    );
};

export const initSocket = (server) => {
    const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:3000";

    io = new Server(server, {
        cors: {
            origin: frontendUrl,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(
            `Socket connected: ${socket.id}`
        );

        /*
         * START MONITORING
         */
        socket.on(
            "monitor:start",
            (data, callback) => {
                if (
                    !isValidSessionId(
                        data?.sessionId
                    )
                ) {
                    return sendError(
                        socket,
                        "Invalid or missing sessionId",
                        callback
                    );
                }

                const sessionId =
                    data.sessionId.trim();

                const room =
                    `session:${sessionId}`;

                socket.join(room);

                /*
                 * USB DEMO MODE:
                 *
                 * The currently monitored session becomes
                 * the destination for Arduino samples.
                 */
                setSerialSession(sessionId);

                const ackPayload = {
                    success: true,
                    sessionId
                };

                if (
                    typeof callback === "function"
                ) {
                    callback(ackPayload);
                }

                console.log(
                    `Monitoring started for session: ${sessionId}`
                );
            }
        );

        /*
         * STOP MONITORING
         */
        socket.on(
            "monitor:stop",
            (data, callback) => {
                if (
                    !isValidSessionId(
                        data?.sessionId
                    )
                ) {
                    return sendError(
                        socket,
                        "Invalid or missing sessionId",
                        callback
                    );
                }

                const sessionId =
                    data.sessionId.trim();

                const room =
                    `session:${sessionId}`;

                socket.leave(room);

                /*
                 * Only clear USB mode if this is
                 * the currently active serial session.
                 */
                if (
                    activeSerialSessionId === sessionId
                ) {
                    clearSerialSession(sessionId);
                }

                cleanupSessionState(
                    sessionId,
                    room
                );

                const ackPayload = {
                    success: true,
                    sessionId
                };

                if (
                    typeof callback === "function"
                ) {
                    callback(ackPayload);
                }

                console.log(
                    `Monitoring stopped for session: ${sessionId}`
                );
            }
        );

        /*
         * FRONTEND ECG DATA
         *
         * This continues to support the original
         * Socket.IO ECG input.
         */
        socket.on(
            "ecg:data",
            (data, callback) => {
                if (
                    !isValidSessionId(
                        data?.sessionId
                    )
                ) {
                    return sendError(
                        socket,
                        "Invalid or missing sessionId",
                        callback
                    );
                }

                if (
                    !isValidSample(data?.sample)
                ) {
                    return sendError(
                        socket,
                        "Invalid ECG sample",
                        callback
                    );
                }

                const sessionId =
                    data.sessionId.trim();

                const room =
                    `session:${sessionId}`;

                /*
                 * Make sure this socket actually
                 * joined the requested session.
                 */
                if (!socket.rooms.has(room)) {
                    return sendError(
                        socket,
                        "Socket is not subscribed to this session",
                        callback
                    );
                }

                /*
                 * Process through the same pipeline
                 * used by Arduino USB.
                 */
                processECGSample(
                    sessionId,
                    data.sample
                );

                if (
                    typeof callback === "function"
                ) {
                    callback({
                        success: true
                    });
                }
            }
        );

        /*
         * DISCONNECT
         */
        socket.on("disconnect", () => {
            console.log(
                `Socket disconnected: ${socket.id}`
            );

            /*
             * Check and clean all empty sessions.
             */
            for (
                const sessionId
                of sessionBuffers.keys()
            ) {
                const room =
                    `session:${sessionId}`;

                cleanupSessionState(
                    sessionId,
                    room
                );

                /*
                 * If nobody is monitoring the active
                 * serial session anymore, stop USB mode.
                 */
                if (
                    activeSerialSessionId === sessionId
                ) {
                    const subscriberCount =
                        io.sockets.adapter.rooms.get(room)?.size ?? 0;

                    if (subscriberCount === 0) {
                        clearSerialSession(sessionId);
                    }
                }
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.io has not been initialized!"
        );
    }

    return io;
};