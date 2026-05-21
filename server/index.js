import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { initDB } from "./db/index.js";

import authRouter from "./routes/auth.js";
import fitnessRouter from "./routes/fitness.js";
import dietRouter from "./routes/diet.js";
import logsRouter from "./routes/logs.js";
import adminRouter from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(__dirname, "..", ".env"),
});

const app = express();


// ================= CORS FIX =================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",

  // ADD YOUR RENDER FRONTEND URLS
  "https://fitrack-1-okv6.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);


// ================= MIDDLEWARE =================
app.use(express.json());


// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("FITTRACK API Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
  });
});


// ================= ROUTES =================
app.use("/api/auth", authRouter);
app.use("/api/fitness", fitnessRouter);
app.use("/api/diet", dietRouter);
app.use("/api/logs", logsRouter);
app.use("/api/admin", adminRouter);


// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});


// ================= START SERVER =================
initDB()
  .then(() => {
    console.log("DB tables ready");

    const port = process.env.PORT || 5000;

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("DB init failed", error);

    process.exit(1);
  });
