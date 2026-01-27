import mongoose from "mongoose";

const mountainSchema = new mongoose.Schema(
  {
    name: { type: String, },
    category: { type: String },
    country: { type: String },
    meaning: { type: String },
    height: { type: Number },
    latitude: { type: Number },
    longitude: { type: Number },
    region: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

const Mountain = mongoose.model("Mountain", mountainSchema);

export default Mountain;
