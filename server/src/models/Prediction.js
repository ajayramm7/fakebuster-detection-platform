import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: String,
      enum: ["correct", "wrong", "unsure"],
      default: "unsure"
    },
    actualLabel: {
      type: String,
      default: ""
    },
    note: {
      type: String,
      default: ""
    }
  },
  { _id: false, timestamps: true }
);

const predictionSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      enum: ["fake_news", "spam"],
      required: true
    },
    source: {
      type: String,
      enum: ["single", "batch"],
      default: "single"
    },
    inputText: {
      type: String,
      default: ""
    },
    fileName: {
      type: String,
      default: ""
    },
    rowCount: {
      type: Number,
      default: 1
    },
    highRiskCount: {
      type: Number,
      default: 0
    },
    label: {
      type: String,
      default: ""
    },
    riskScore: {
      type: Number,
      default: null
    },
    riskLevel: {
      type: String,
      default: "unknown"
    },
    explanation: {
      type: String,
      default: ""
    },
    signals: {
      type: [String],
      default: []
    },
    safetyTip: {
      type: String,
      default: ""
    },
    feedback: {
      type: feedbackSchema,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.models.Prediction || mongoose.model("Prediction", predictionSchema);
