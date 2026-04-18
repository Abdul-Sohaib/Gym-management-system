import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import router from "./routes/index.js";
import authRouter from "./routes/auth.js";
import membersRouter from "./routes/members.js";
import notificationsRouter from "./routes/notifications.js";
import analyticsRouter from "./routes/analytics.js";
import settingsRouter from "./routes/settings.js";
import { initCronJobs } from "./services/cronService.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

let cronInitialized = false;

async function connectMongoWithRetry(): Promise<void> {
  try {
    await mongoose.connect(env.mongoDbUri);
    logger.info("MongoDB connected");

    if (!cronInitialized) {
      initCronJobs();
      cronInitialized = true;
    }
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed. Retrying in 5 seconds.");
    setTimeout(() => {
      void connectMongoWithRetry();
    }, 5000);
  }
}

void connectMongoWithRetry();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);
app.use("/api/auth", authRouter);
app.use("/api/members", membersRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);

export default app;
