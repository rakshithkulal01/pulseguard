import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import { processSerialSample } from "../sockets/socket.js";

const SERIAL_PORT =
    process.env.ARDUINO_PORT || "COM3";

const BAUD_RATE = 115200;

const port = new SerialPort({
    path: SERIAL_PORT,
    baudRate: BAUD_RATE
});

const parser = port.pipe(
    new ReadlineParser({
        delimiter: "\r\n"
    })
);

port.on("open", () => {
    console.log(
        `Arduino connected on ${SERIAL_PORT}`
    );

    console.log(
        "USB ECG demo mode ready."
    );
});

port.on("error", (error) => {
    console.error(
        "Arduino serial error:",
        error.message
    );
});

parser.on("data", (data) => {
    const sample = Number(
        String(data).trim()
    );

    if (!Number.isFinite(sample)) {
        return;
    }

    /*
     * Send the sample into the existing
     * Socket.IO → buffer → FastAPI pipeline.
     */
    processSerialSample(sample);
});