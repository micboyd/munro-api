import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["planned", "training", "in-progress", "completed", "abandoned"],
      default: "planned",
    },
    progressPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completedAt: { type: Date },
    success: { type: Boolean },
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;