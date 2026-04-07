import { Router } from "express";
import healthRouter from "./health.routes.js";
import { appConfigRouter } from "./app-config.routes.js";

const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/app-config", appConfigRouter);

export default v1Router;
