import http from "http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { app } from "./app.js";

const server = http.createServer(app);

server.listen(env.API_PORT, () => {
  logger.info({ port: env.API_PORT }, "API server started");
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down API server");
  server.close(() => {
    logger.info("API server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.warn("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
