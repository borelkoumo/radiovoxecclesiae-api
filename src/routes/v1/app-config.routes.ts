import { Router } from "express";
import { handleGetAppConfig } from "../../controllers/app-config.controller.js";
import { optionalAuth } from "../../middleware/auth.js";
import { generalLimiter } from "../../middleware/rate-limit.js";

export const appConfigRouter = Router();

appConfigRouter.get("/", generalLimiter, optionalAuth, handleGetAppConfig);
