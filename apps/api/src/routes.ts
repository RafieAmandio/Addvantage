import type { Express } from "express";
import { healthRoutes } from "./features/health/health.routes.js";

export function mountRoutes(app: Express) {
  app.use("/health", healthRoutes);

  // Phase 2+: feature routes will be mounted here
  // app.use("/news", newsRoutes);
  // app.use("/plans", planRoutes);
  // app.use("/consult", consultRoutes);
  // app.use("/bars", chartRoutes);
  // app.use("/events", calendarRoutes);
  // app.use("/timeline", timelineRoutes);
  // app.use("/education", educationRoutes);
  // app.use("/tags", tagRoutes);
  // app.use("/search", searchRoutes);
  // app.use("/sources", sourceRoutes);
  // app.use("/users", userRoutes);
  // app.use("/webhooks/payment", subscriptionRoutes);
}
