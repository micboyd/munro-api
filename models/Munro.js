import mongoose from "mongoose";

const munroSchema = new mongoose.Schema(
  {
    hill_id: { type: Number },
    hill_list: { type: String, trim: true },
    hill_name: { type: String, trim: true },
    meaning: { type: String, trim: true },

    height: { type: Number },
    height_drop: { type: Number },

    latitude: { type: Number },
    longitude: { type: Number },

    os_ref: { type: Number },
    region_name: { type: String, trim: true },

    image_url: { type: String, trim: true },
  },
  { timestamps: true }
);

const Munro = mongoose.model("Munro", munroSchema);
export default Munro;
