import { Router } from "express";
import { handleListPrayers, handleCreatePrayer } from "../../controllers/prayer.controller.js";

export const prayerRouter = Router();

prayerRouter.get("/", handleListPrayers);
prayerRouter.post("/", handleCreatePrayer);
