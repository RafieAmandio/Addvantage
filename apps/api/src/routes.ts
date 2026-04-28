import type { Express } from "express";
import { healthRoutes } from "./features/health/health.routes.js";
import { sourceRoutes } from "./features/source/source.routes.js";
import { tagRoutes } from "./features/tag/tag.routes.js";
import { searchRoutes } from "./features/search/search.routes.js";
import { newsRoutes } from "./features/news/news.routes.js";
import { planRoutes } from "./features/plan/plan.routes.js";
import { consultRoutes } from "./features/consult/consult.routes.js";
import { chartRoutes } from "./features/chart/chart.routes.js";
import { calendarRoutes } from "./features/calendar/calendar.routes.js";
import { timelineRoutes } from "./features/timeline/timeline.routes.js";
import { userRoutes } from "./features/user/user.routes.js";
import { authRoutes } from "./features/auth/auth.routes.js";

export function mountRoutes(app: Express) {
  app.use("/health", healthRoutes);
  app.use("/sources", sourceRoutes);
  app.use("/tags", tagRoutes);
  app.use("/search", searchRoutes);
  app.use("/news", newsRoutes);
  app.use("/plans", planRoutes);
  app.use("/consult", consultRoutes);
  app.use("/bars", chartRoutes);
  app.use("/events", calendarRoutes);
  app.use("/timeline", timelineRoutes);
  app.use("/users", userRoutes);
  app.use("/auth", authRoutes);

  // Phase 8+: feature routes will be mounted here
  // app.use("/bars", chartRoutes);
  // app.use("/events", calendarRoutes);
  // app.use("/timeline", timelineRoutes);
  // app.use("/education", educationRoutes);
  // app.use("/users", userRoutes);
  // app.use("/webhooks/payment", subscriptionRoutes);
}
