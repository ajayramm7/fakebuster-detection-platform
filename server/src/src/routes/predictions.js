import { Router } from "express";
import multer from "multer";

import { getDownload, registerDownload } from "../services/downloadStore.js";
import { saveFeedback, listPredictions, savePrediction } from "../services/historyStore.js";
import { getMlHealth, predictBatch, predictText } from "../services/mlService.js";
import { detectTextColumn, parseCsv, previewRows, toCsv } from "../utils/csv.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

function normalizeTask(task) {
  return task === "spam" ? "spam" : "fake_news";
}

function normalizeThreshold(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return Math.min(100, Math.max(0, parsed));
}

router.get("/health", async (_req, res) => {
  const ml = await getMlHealth();
  res.json({
    status: "ok",
    api: "online",
    ml
  });
});

router.get("/predictions", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 25);
    const items = await listPredictions(limit);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/predict", async (req, res, next) => {
  try {
    const task = normalizeTask(req.body.task);
    const text = String(req.body.text || req.body.message || "").trim();
    const threshold = normalizeThreshold(req.body.threshold);

    if (!text) {
      res.status(400).json({ error: "Text is required." });
      return;
    }

    const result = await predictText({ task, text, threshold });
    const saved = await savePrediction({
      task,
      source: "single",
      inputText: text,
      rowCount: 1,
      highRiskCount: result.isRisky ? 1 : 0,
      label: result.label,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      explanation: result.explanation,
      signals: result.signals,
      safetyTip: result.safetyTip
    });

    res.json({
      result: {
        ...result,
        id: saved.id
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/predict/batch", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "CSV file is required." });
      return;
    }

    const task = normalizeTask(req.body.task);
    const threshold = normalizeThreshold(req.body.threshold);
    const records = parseCsv(req.file.buffer);
    const textColumn = detectTextColumn(records, req.body.textColumn || "");

    if (!records.length) {
      res.status(400).json({ error: "CSV file has no rows." });
      return;
    }

    if (!textColumn) {
      res.status(400).json({
        error: "Could not detect a text column. Try message, text, content, headline, body, or article."
      });
      return;
    }

    const texts = records.map((record) => String(record[textColumn] || ""));
    const batch = await predictBatch({ task, texts, threshold });
    const predictions = batch.predictions || [];

    const enriched = records.map((record, index) => {
      const prediction = predictions[index] || {};
      return {
        ...record,
        prediction: prediction.label || "",
        riskScore: prediction.riskScore ?? "",
        riskLevel: prediction.riskLevel || "",
        explanation: prediction.explanation || ""
      };
    });

    const highRiskCount = predictions.filter((prediction) => prediction.riskLevel === "high").length;
    const csv = toCsv(enriched);
    const originalName = req.file.originalname || "predictions.csv";
    const downloadName = originalName.toLowerCase().endsWith(".csv")
      ? originalName.replace(/\.csv$/i, "_predictions.csv")
      : `${originalName}_predictions.csv`;
    const downloadId = registerDownload({ csv, fileName: downloadName });

    const saved = await savePrediction({
      task,
      source: "batch",
      fileName: originalName,
      rowCount: records.length,
      highRiskCount,
      label: `${records.length} rows analyzed`,
      riskScore: records.length ? Math.round((highRiskCount / records.length) * 1000) / 10 : 0,
      riskLevel: highRiskCount > 0 ? "medium" : "low",
      explanation: `Detected ${highRiskCount} high-risk rows using ${textColumn}.`,
      signals: [textColumn],
      safetyTip: "Review high-risk rows manually before acting on the batch output."
    });

    res.json({
      summary: {
        id: saved.id,
        task,
        fileName: originalName,
        rows: records.length,
        highRiskCount,
        textColumn
      },
      preview: previewRows(enriched),
      download: {
        id: downloadId,
        fileName: downloadName
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/downloads/:id", (req, res) => {
  const download = getDownload(req.params.id);
  if (!download) {
    res.status(404).json({ error: "Download expired or not found." });
    return;
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${download.fileName}"`);
  res.send(download.csv);
});

router.post("/feedback", async (req, res, next) => {
  try {
    const predictionId = String(req.body.predictionId || "").trim();
    if (!predictionId) {
      res.status(400).json({ error: "predictionId is required." });
      return;
    }

    const updated = await saveFeedback({
      predictionId,
      rating: req.body.rating,
      actualLabel: req.body.actualLabel,
      note: req.body.note
    });

    res.json({
      ok: true,
      prediction: updated
    });
  } catch (error) {
    next(error);
  }
});

export default router;
