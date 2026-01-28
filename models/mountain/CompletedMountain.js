import mongoose from "mongoose";

const completedMountainSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },    
    mountainId: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    dateCompleted: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    summitPhotos: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const CompletedMountain = mongoose.model(
  "CompletedMountain",
  completedMountainSchema
);

export default CompletedMountain;
