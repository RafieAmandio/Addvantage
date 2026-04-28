import type { Express } from "express";
import { healthRoutes } from "./features/health/health.routes.js";
import { sourceRoutes } from "./features/source/source.routes.js";
import { tagRoutes } from "./features/tag/tag.routes.js";
import { searchRoutes } from "./features/search/search.routes.js";

export function mountRoutes(app: Express) {
  app.use("/health", healthRoutes);
  app.use("/sources", sourceRoutes);
  app.use("/tags", tagRoutes);
  app.use("/search", searchRoutes);

  // Phase 3+: feature routes will be mounted here
  // app.use("/news", newsRoutes);
  // app.use("/plans", planRoutes);
  // app.use("/consult", consultRoutes);
  // app.use("/bars", chartRoutes);
  // app.use("/events", calendarRoutes);
  // app.use("/timeline", timelineRoutes);
  // app.use("/education", educationRoutes);
  // app.use("/users", userRoutes);
  // app.use("/webhooks/payment", subscriptionRoutes);
}
