import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { logger } from "./middleware/request-logger.js";

// Eagerly validate Firebase connection on startup
import "./config/firebase.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    "RVE API server started"
  );
});
