import mongoose from "mongoose";

const tripPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            default: null,
        },

        startDate: {
            type: Date,
            default: null,
        },

        endDate: {
            type: Date,
            default: null,
        },

        mountains: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Mountain",
            },
        ],
    },
    { timestamps: true }
);

const TripPlan = mongoose.model("TripPlan", tripPlanSchema);

export default TripPlan;
