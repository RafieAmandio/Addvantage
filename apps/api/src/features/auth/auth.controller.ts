import { createClient } from "@supabase/supabase-js";
import type { Response } from "express";
import { asyncHandler } from "@/core/utils/async-handler.js";
import { sendSuccess } from "@/core/utils/response.js";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import type { AuthRequest } from "@/core/types/request.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export const authController = {
  logout: asyncHandler(async (req, res: Response) => {
    const authReq = req as AuthRequest;
    const { error } = await supabase.auth.admin.signOut(authReq.user.id);
    if (error) {
      logger.error({ err: error, userId: authReq.user.id, scope: "auth.logout" }, "logout failed");
    }
    sendSuccess(res, null, "Logged out");
  }),
};
