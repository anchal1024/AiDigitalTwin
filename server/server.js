import cors from "cors";
import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import "dotenv/config";

import { jwtAuth } from "./middleware/index.js";
import { logger } from "./utils/index.js";
import authRoutes from "./routers/authRoutes.js";
import botRoutes from "./routers/botRoutes.js";
import imageRoutes from "./routers/imageRoutes.js"
import adminRoutes from "./routers/adminRoutes.js";
import { googleAuthentication } from "./controllers/authController.js";

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: "*",
  })
);

app.get("/", (req, res) => {
  res.send("<h1>Server is running</h1>");
});

// Routes
app.use('/auth', authRoutes);
app.use('/bot', botRoutes);
app.use('/image',imageRoutes );

app.post('/run-auth', googleAuthentication);

app.use(jwtAuth);
app.use('/admin', adminRoutes);

const gracefulShutdown = async () => {
  await mongoose.connection.close();

  logger.info("Server closed");
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

const initializeServer = async () => {
  try {

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

initializeServer();