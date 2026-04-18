import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const isProduction = process.env.NODE_ENV === "production";
const MAX_DEV_PORT_ATTEMPTS = 20;

function listenOnPort(port: number, allowFallback: boolean, attemptsLeft = MAX_DEV_PORT_ATTEMPTS) {
  app.listen(port, (err) => {
    if (!err) {
      logger.info({ port }, "Server listening");
      return;
    }

    if (
      (err as NodeJS.ErrnoException).code === "EADDRINUSE" &&
      allowFallback &&
      attemptsLeft > 0
    ) {
      const fallbackPort = port + 1;
      logger.warn(
        { port, fallbackPort, attemptsLeft },
        "Configured port is in use. Trying fallback port.",
      );
      listenOnPort(fallbackPort, true, attemptsLeft - 1);
      return;
    }

    logger.error({ err }, "Error listening on port");
    process.exit(1);
  });
}

listenOnPort(env.port, !isProduction);
