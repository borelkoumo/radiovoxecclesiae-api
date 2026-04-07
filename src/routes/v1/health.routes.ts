import { Router } from "express";
import { sendSuccess } from "../../utils/response.js";

const router = Router();

router.get("/", (_req, res) => {
  sendSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
