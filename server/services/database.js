import mongoose from "mongoose";
import "dotenv/config";

import logger from "../utils/logger.js";

const MONGO_URI = process.env.MONGO_URI;

const maxRetries = 3;
let retryCount = 0;

const connectToDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("Connected to database successfully");

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });
    

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected, attempting to reconnect...");
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(connectToDB, 5000);
      }
    });
  } catch (err) {
    logger.error("Failed to connect to database:", err);
    if (retryCount < maxRetries) {
      retryCount++;
      logger.info(`Retrying connection... Attempt ${retryCount}/${maxRetries}`);
      setTimeout(connectToDB, 5000);
    }
  }
};

export default connectToDB;
