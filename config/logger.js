import winston from "winston";
import fs from "fs";
import path from "path";

const level = process.env.LOG_LEVEL || "info";

fs.mkdirSync(path.resolve("logs"), { recursive: true });

export const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.resolve("logs/error.log"),
      level: "error"
    }),
    new winston.transports.File({
      filename: path.resolve("logs/info.log"),
      level: "info"
    })
  ]
});

// In dev: also log to console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}
