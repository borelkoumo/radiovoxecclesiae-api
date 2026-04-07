import { Router } from "express";
import { handleGetAppConfig } from "../../controllers/app-config.controller.js";
import { optionalAuth } from "../../middleware/auth.js";

export const appConfigRouter = Router();

appConfigRouter.get("/", optionalAuth, handleGetAppConfig);
