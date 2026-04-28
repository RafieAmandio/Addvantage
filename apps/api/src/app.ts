import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { requestId } from "./core/middleware/request-id.middleware.js";
import { errorHandler } from "./core/middleware/error.middleware.js";
import { mountRoutes } from "./routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(requestId);

mountRoutes(app);

app.use(errorHandler);

export { app };
