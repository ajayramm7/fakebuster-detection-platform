import { randomUUID } from "crypto";

import { isMongoConnected } from "../config/db.js";
import Feedback from "../models/Feedback.js";
import Prediction from "../models/Prediction.js";

const memoryPredictions = [];
const memoryFeedback = [];

function publicPrediction(item) {
  const plain = typeof item.toObject === "function" ? item.toObject() : item;
  return {
    id: String(plain._id || plain.id),
    task: plain.task,
    source: plain.source,
    inputText: plain.inputText,
    fileName: plain.fileName,
    rowCount: plain.rowCount,
    highRiskCount: plain.highRiskCount,
    label: plain.label,
    riskScore: plain.riskScore,
    riskLevel: plain.riskLevel,
    explanation: plain.explanation,
    signals: plain.signals || [],
    safetyTip: plain.safetyTip,
    feedback: plain.feedback || null,
    createdAt: plain.createdAt
  };
}

export async function savePrediction(payload) {
  if (isMongoConnected()) {
    const created = await Prediction.create(payload);
    return publicPrediction(created);
  }

  const item = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload
  };
  memoryPredictions.unshift(item);
  memoryPredictions.splice(50);
  return publicPrediction(item);
}

export async function listPredictions(limit = 25) {
  if (isMongoConnected()) {
    const items = await Prediction.find().sort({ createdAt: -1 }).limit(limit);
    return items.map(publicPrediction);
  }

  return memoryPredictions.slice(0, limit).map(publicPrediction);
}

export async function saveFeedback({ predictionId, rating, actualLabel, note }) {
  const feedback = {
    rating: rating || "unsure",
    actualLabel: actualLabel || "",
    note: note || ""
  };

  if (isMongoConnected()) {
    await Feedback.create({ predictionId, ...feedback });
    const updated = await Prediction.findByIdAndUpdate(
      predictionId,
      { feedback },
      { new: true }
    );
    return updated ? publicPrediction(updated) : null;
  }

  memoryFeedback.unshift({
    id: randomUUID(),
    predictionId,
    createdAt: new Date().toISOString(),
    ...feedback
  });

  const item = memoryPredictions.find((prediction) => prediction.id === predictionId);
  if (item) {
    item.feedback = feedback;
    return publicPrediction(item);
  }
  return null;
}
