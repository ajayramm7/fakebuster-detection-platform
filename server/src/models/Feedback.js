import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    predictionId: {
      type: String,
      required: true
    },
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
  { timestamps: true }
);

export default mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
