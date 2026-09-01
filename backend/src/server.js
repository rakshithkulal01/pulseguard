import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = initSocket(server);

const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Closing Socket.IO and HTTP server...`);
  io.close(() => {
    server.close(() => {
      console.log("Server closed cleanly.");
      process.exit(0);
    });
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});