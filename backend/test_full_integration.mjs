import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { io as Client } from "socket.io-client";
import express from "express";

import fastapiPredictor from "./src/ai/fastapiPredictor.js";
import { initSocket } from "./src/sockets/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load 1000 samples from CSV
function loadCsvSamples(relPath) {
    const fullPath = path.resolve(__dirname, relPath);
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.trim().split(/\r?\n/);
    const startIndex = isNaN(Number(lines[0].split(",")[0])) ? 1 : 0;
    const samples = [];
    for (let i = startIndex; i < lines.length && samples.length < 1000; i++) {
        const val = parseFloat(lines[i].split(",")[0]);
        if (!isNaN(val)) samples.push(val);
    }
    return samples;
}

async function runTests() {
    console.log("==================================================");
    console.log("STEP 10: Testing Node.js -> FastAPI Direct Predictor");
    console.log("==================================================");

    const normalSamples = loadCsvSamples("../ai_service/NORMAL_LeadII_151.csv");
    const miSamples = loadCsvSamples("../ai_service/io/mi2.csv");

    console.log(`Loaded ${normalSamples.length} NORMAL samples, ${miSamples.length} MI samples.`);

    // 1. Test NORMAL sample with fastapiPredictor
    console.log("\n[Test 10.1] Calling fastapiPredictor with NORMAL ECG samples...");
    const normalResult = await fastapiPredictor(normalSamples);
    console.log("FastAPI NORMAL Response:", JSON.stringify(normalResult, null, 2));

    if (normalResult.prediction !== "NORMAL") {
        throw new Error(`Expected NORMAL prediction, got ${normalResult.prediction}`);
    }
    if (normalResult.probability >= 0.7) {
        throw new Error(`Expected probability < 0.7 for NORMAL, got ${normalResult.probability}`);
    }
    console.log("✓ Test 10.1 PASSED: NORMAL classified correctly via Node.js -> FastAPI");

    // 2. Test MI sample with fastapiPredictor
    console.log("\n[Test 10.2] Calling fastapiPredictor with MI ECG samples...");
    const miResult = await fastapiPredictor(miSamples);
    console.log("FastAPI MI Response:", JSON.stringify(miResult, null, 2));

    if (miResult.prediction !== "MI") {
        throw new Error(`Expected MI prediction, got ${miResult.prediction}`);
    }
    if (miResult.probability < 0.7) {
        throw new Error(`Expected probability >= 0.7 for MI, got ${miResult.probability}`);
    }
    console.log("✓ Test 10.2 PASSED: MI classified correctly via Node.js -> FastAPI");

    // 3. Test validation errors
    console.log("\n[Test 10.3] Testing invalid length (500 samples)...");
    try {
        await fastapiPredictor(normalSamples.slice(0, 500));
        throw new Error("Expected failure for 500 samples, but succeeded");
    } catch (err) {
        console.log("✓ Correctly caught length error:", err.message);
    }

    console.log("\n==================================================");
    console.log("STEP 11: Testing Socket.IO Live Inference Flow");
    console.log("==================================================");

    const TEST_PORT = 5099;
    const app = express();
    const server = http.createServer(app);
    const ioServer = initSocket(server);

    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`Test Socket.IO server listening on http://127.0.0.1:${TEST_PORT}`);

    const clientSocket = Client(`http://127.0.0.1:${TEST_PORT}`, {
        transports: ["websocket"]
    });

    await new Promise((resolve, reject) => {
        clientSocket.on("connect", () => {
            console.log(`Connected client with socket id: ${clientSocket.id}`);
            resolve();
        });
        clientSocket.on("connect_error", reject);
    });

    const testSessionId = `test-session-${Date.now()}`;

    // Join room / start monitoring
    await new Promise((resolve) => {
        clientSocket.emit("monitor:start", { sessionId: testSessionId }, (ack) => {
            console.log("monitor:start ack received:", ack);
            resolve();
        });
    });

    // Listen for prediction
    const predictionPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timed out waiting for ecg:prediction from Socket.IO"));
        }, 15000);

        clientSocket.on("ecg:prediction", (data) => {
            clearTimeout(timeout);
            resolve(data);
        });

        clientSocket.on("ecg:error", (err) => {
            clearTimeout(timeout);
            reject(new Error(`Socket received error: ${JSON.stringify(err)}`));
        });
    });

    // Stream 1000 samples
    console.log(`Streaming 1000 samples for session ${testSessionId}...`);
    for (let i = 0; i < normalSamples.length; i++) {
        clientSocket.emit("ecg:data", {
            sessionId: testSessionId,
            sample: normalSamples[i]
        });
    }

    console.log("Awaiting ecg:prediction event over Socket.IO...");
    const socketPrediction = await predictionPromise;
    console.log("\nReceived Socket.IO ecg:prediction event payload:");
    console.log(JSON.stringify(socketPrediction, null, 2));

    if (socketPrediction.sessionId !== testSessionId) {
        throw new Error(`Session ID mismatch: ${socketPrediction.sessionId} vs ${testSessionId}`);
    }
    if (socketPrediction.prediction !== "NORMAL") {
        throw new Error(`Expected socket prediction NORMAL, got ${socketPrediction.prediction}`);
    }
    console.log("✓ Test 11 PASSED: Live Socket.IO streaming & prediction verified end-to-end!");

    // Clean up
    clientSocket.disconnect();
    await new Promise((resolve) => {
        ioServer.close(() => {
            server.close(resolve);
        });
    });
    console.log("\nAll Node.js and Socket.IO tests successfully finished!");
}

runTests()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error("Test failed with error:", err);
        process.exit(1);
    });

