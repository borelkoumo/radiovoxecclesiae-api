import { Router } from "express";
import { handleListPrayers, handleCreatePrayer } from "../../controllers/prayer.controller.js";
import { generalLimiter, prayerWriteLimiter } from "../../middleware/rate-limit.js";

export const prayerRouter = Router();

prayerRouter.get("/", generalLimiter, handleListPrayers);
prayerRouter.post("/", prayerWriteLimiter, handleCreatePrayer);
