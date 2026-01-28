import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    mountainId: { type: String, required: true },
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);

export default Goal;