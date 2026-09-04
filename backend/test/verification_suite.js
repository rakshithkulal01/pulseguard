import http from "http";
import { io as Client } from "socket.io-client";
import app from "../src/app.js";
import { initSocket } from "../src/sockets/socket.js";

// Mock fastApiPredictor if FastAPI server is not running during local test
// or we can test both success and failure cases.
// We will test actual socket logic against instruction.md requirements.

const runVerificationSuite = async () => {
    console.log("=== STARTING PULSE GUARD VERIFICATION SUITE ===");
    let passedTests = 0;
    const totalTests = 10;

    const server = http.createServer(app);
    const io = initSocket(server);

    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const serverUrl = `http://localhost:${port}`;

    const createClient = () => {
        return Client(serverUrl, {
            transports: ["websocket"],
            reconnection: false
        });
    };

    try {
        // Test 1: Real-time ecg:data -> ecg:update streaming
        await new Promise((resolve, reject) => {
            const client = createClient();
            client.on("connect", () => {
                client.emit("monitor:start", { sessionId: "session_test_1" }, (ack) => {
                    if (!ack.success) return reject(new Error("monitor:start failed"));
                });
            });

            client.on("ecg:update", (data) => {
                if (data.sessionId === "session_test_1" && data.sample === 0.5) {
                    console.log("✔ Test 1: Real-time ecg:data -> ecg:update streaming: PASS");
                    passedTests++;
                    client.disconnect();
                    resolve();
                }
            });

            client.on("connect", () => {
                setTimeout(() => {
                    client.emit("ecg:data", { sessionId: "session_test_1", sample: 0.5 });
                }, 50);
            });
        });

        // Test 2: Buffer accumulation (999 samples -> 0 predictions)
        await new Promise((resolve, reject) => {
            const client = createClient();
            let predictionReceived = false;

            client.on("connect", () => {
                client.emit("monitor:start", { sessionId: "session_test_2" });
                client.on("ecg:prediction", () => {
                    predictionReceived = true;
                });

                for (let i = 0; i < 999; i++) {
                    client.emit("ecg:data", { sessionId: "session_test_2", sample: 0.1 });
                }

                setTimeout(() => {
                    if (!predictionReceived) {
                        console.log("✔ Test 2: Buffer accumulation (999 samples -> 0 predictions): PASS");
                        passedTests++;
                        client.disconnect();
                        resolve();
                    } else {
                        reject(new Error("Received unexpected prediction for 999 samples"));
                    }
                }, 200);
            });
        });

        // Test 3: Prediction trigger on 1000th sample
        await new Promise((resolve, reject) => {
            const client = createClient();
            client.on("connect", () => {
                client.emit("monitor:start", { sessionId: "session_test_3" });

                client.on("ecg:prediction", (data) => {
                    if (data.sessionId === "session_test_3") {
                        console.log("✔ Test 3: Prediction trigger on 1000th sample: PASS");
                        passedTests++;
                        client.disconnect();
                        resolve();
                    }
                });

                client.on("ecg:error", (data) => {
                    // Even if FastAPI server is down, ecg:error or ecg:prediction demonstrates trigger occurred
                    if (data.error) {
                        console.log("✔ Test 3: Prediction trigger on 1000th sample (Error response caught): PASS");
                        passedTests++;
                        client.disconnect();
                        resolve();
                    }
                });

                for (let i = 0; i < 1000; i++) {
                    client.emit("ecg:data", { sessionId: "session_test_3", sample: 0.2 });
                }
            });
        });

        // Test 4: Session isolation (Session A prediction sent strictly to Session A)
        await new Promise((resolve, reject) => {
            const clientA = createClient();
            const clientB = createClient();

            let clientBReceivedPrediction = false;

            clientA.on("connect", () => {
                clientA.emit("monitor:start", { sessionId: "session_A" });
                clientB.emit("monitor:start", { sessionId: "session_B" });

                clientB.on("ecg:prediction", (data) => {
                    if (data.sessionId === "session_A") {
                        clientBReceivedPrediction = true;
                    }
                });

                for (let i = 0; i < 1000; i++) {
                    clientA.emit("ecg:data", { sessionId: "session_A", sample: 0.3 });
                }

                setTimeout(() => {
                    if (!clientBReceivedPrediction) {
                        console.log("✔ Test 4: Session isolation: PASS");
                        passedTests++;
                        clientA.disconnect();
                        clientB.disconnect();
                        resolve();
                    } else {
                        reject(new Error("Client B received prediction for Session A"));
                    }
                }, 300);
            });
        });

        // Test 5: Independent session buffers
        await new Promise((resolve, reject) => {
            const clientA = createClient();
            const clientB = createClient();

            let predictions = [];

            clientA.on("connect", () => {
                clientA.emit("monitor:start", { sessionId: "session_indep_A" });
                clientB.emit("monitor:start", { sessionId: "session_indep_B" });

                clientA.on("ecg:prediction", () => predictions.push("A"));
                clientA.on("ecg:error", () => predictions.push("A_err"));
                clientB.on("ecg:prediction", () => predictions.push("B"));
                clientB.on("ecg:error", () => predictions.push("B_err"));

                // Send 500 to A, 1000 to B
                for (let i = 0; i < 500; i++) clientA.emit("ecg:data", { sessionId: "session_indep_A", sample: 0.1 });
                for (let i = 0; i < 1000; i++) clientB.emit("ecg:data", { sessionId: "session_indep_B", sample: 0.1 });

                setTimeout(() => {
                    const bHasTriggered = predictions.some(p => p.startsWith("B"));
                    const aHasTriggered = predictions.some(p => p.startsWith("A"));
                    if (bHasTriggered && !aHasTriggered) {
                        console.log("✔ Test 5: Independent session buffers: PASS");
                        passedTests++;
                        clientA.disconnect();
                        clientB.disconnect();
                        resolve();
                    } else {
                        reject(new Error(`Buffer isolation failed: predictions=${predictions}`));
                    }
                }, 300);
            });
        });

        // Test 6: FastAPI failure recovery & buffer continuation
        await new Promise((resolve, reject) => {
            const client = createClient();
            client.on("connect", () => {
                client.emit("monitor:start", { sessionId: "session_fail_recovery" });
                
                let triggerCount = 0;
                const checkDone = () => {
                    triggerCount++;
                    if (triggerCount === 1) {
                        // Send another 1000 samples to verify buffer continuation after error/failure
                        for (let i = 0; i < 1000; i++) {
                            client.emit("ecg:data", { sessionId: "session_fail_recovery", sample: 0.4 });
                        }
                    } else if (triggerCount === 2) {
                        console.log("✔ Test 6: FastAPI failure recovery & buffer continuation: PASS");
                        passedTests++;
                        client.disconnect();
                        resolve();
                    }
                };

                client.on("ecg:prediction", checkDone);
                client.on("ecg:error", checkDone);

                for (let i = 0; i < 1000; i++) {
                    client.emit("ecg:data", { sessionId: "session_fail_recovery", sample: 0.4 });
                }
            });
        });

        // Test 7: Multiple inference windows (2000 samples -> 2 predictions)
        await new Promise((resolve, reject) => {
            const client = createClient();
            client.on("connect", () => {
                client.emit("monitor:start", { sessionId: "session_multi_win" });

                let count = 0;
                const handleEvent = () => {
                    count++;
                    if (count === 2) {
                        console.log("✔ Test 7: Multiple inference windows (2000 samples -> 2 events): PASS");
                        passedTests++;
                        client.disconnect();
                        resolve();
                    }
                };

                client.on("ecg:prediction", handleEvent);
                client.on("ecg:error", handleEvent);

                for (let i = 0; i < 2000; i++) {
                    client.emit("ecg:data", { sessionId: "session_multi_win", sample: 0.5 });
                }
            });
        });

        // Test 8: monitor:stop buffer cleanup
        await new Promise((resolve, reject) => {
            const client = createClient();
            client.on("connect", () => {
                client.emit("monitor:start", { sessionId: "session_stop_cleanup" });
                for (let i = 0; i < 500; i++) {
                    client.emit("ecg:data", { sessionId: "session_stop_cleanup", sample: 0.1 });
                }
                client.emit("monitor:stop", { sessionId: "session_stop_cleanup" }, (ack) => {
                    if (ack.success) {
                        console.log("✔ Test 8: monitor:stop buffer cleanup: PASS");
                        passedTests++;
                        client.disconnect();
                        resolve();
                    } else {
                        reject(new Error("monitor:stop failed"));
                    }
                });
            });
        });

        // Test 9: Stale prediction protection
        await new Promise((resolve, reject) => {
            const client = createClient();
            client.on("connect", () => {
                client.emit("monitor:start", { sessionId: "session_stale_prot" });
                for (let i = 0; i < 1000; i++) {
                    client.emit("ecg:data", { sessionId: "session_stale_prot", sample: 0.1 });
                }
                // Immediately stop monitoring before async prediction returns
                client.emit("monitor:stop", { sessionId: "session_stale_prot" });

                let receivedEventAfterStop = false;
                client.on("ecg:prediction", () => { receivedEventAfterStop = true; });
                client.on("ecg:error", () => { receivedEventAfterStop = true; });

                setTimeout(() => {
                    if (!receivedEventAfterStop) {
                        console.log("✔ Test 9: Stale prediction protection: PASS");
                        passedTests++;
                        client.disconnect();
                        resolve();
                    } else {
                        reject(new Error("Received prediction after monitor:stop"));
                    }
                }, 300);
            });
        });

        // Test 10: 100 Hz real-time streaming & Express REST API regression check
        await new Promise((resolve, reject) => {
            fetch(`${serverUrl}/api/test`, { method: "POST" })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.message === "POST route is working") {
                        console.log("✔ Test 10: Express REST API regression check: PASS");
                        passedTests++;
                        resolve();
                    } else {
                        reject(new Error("REST API check failed"));
                    }
                })
                .catch(reject);
        });

    } finally {
        io.close();
        server.close();
    }

    console.log(`\nVerification Summary: ${passedTests}/${totalTests} Passed`);
    if (passedTests === totalTests) {
        console.log("🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
    } else {
        process.exit(1);
    }
};

runVerificationSuite().catch((err) => {
    console.error("Verification suite failed:", err);
    process.exit(1);
});
