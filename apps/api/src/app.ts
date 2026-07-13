import express from "express";
// Express 4 drops async middleware rejections (requireAuth/requireAdmin/rate
// limiters all async-throw), which crashed the process as an unhandled
// rejection. This patches the router so they reach errorHandler instead.
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { requestId } from "./core/middleware/request-id.middleware.js";
import { errorHandler } from "./core/middleware/error.middleware.js";
import { meetRedirect } from "./core/middleware/meet-redirect.middleware.js";
import { mountRoutes } from "./routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(requestId);

// Host-based shortlink redirects (meet.tradevantage.gg -> Zoom). Runs before
// the normal routes; non-matching hosts fall straight through.
app.use(meetRedirect);

mountRoutes(app);

app.use(errorHandler);

export { app };
