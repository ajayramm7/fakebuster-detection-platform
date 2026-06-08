import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { connectMongo } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import predictionRoutes from "./routes/predictions.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5051;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const clientDist = path.join(projectRoot, "client", "dist");
const clientIndex = path.join(clientDist, "index.html");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.CLIENT_ORIGIN
    ].filter(Boolean),
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/assets/banner.png", (_req, res) => {
  res.sendFile(path.join(projectRoot, "assets", "banner.png"));
});

app.use("/api/auth", authRoutes);
app.use("/api", predictionRoutes);

app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  if (!existsSync(clientIndex)) {
    res.status(404).json({ error: "React build not found. Run npm run build --prefix client." });
    return;
  }
  res.sendFile(clientIndex);
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Server error"
  });
});

await connectMongo();

app.listen(port, () => {
  console.log(`FakeBuster API running on http://localhost:${port}`);
});
