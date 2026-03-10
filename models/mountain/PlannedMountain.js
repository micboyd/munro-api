import mongoose from "mongoose";

const plannedMountainSchema = new mongoose.Schema(
    {
        // ✅ Just store the user ID as a string
        userId: {
            type: String,
            required: true,
            index: true,
        },

        // ✅ Keep this as ObjectId with ref so populate works
        mountainId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mountain",
            required: true,
            index: true,
        },

        plannedDate: {
            type: Date,
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Optional: prevent duplicate plans for same user/mountain/date
plannedMountainSchema.index(
    { userId: 1, mountainId: 1, plannedDate: 1 },
    { unique: true }
);

const PlannedMountain = mongoose.model(
    "PlannedMountain",
    plannedMountainSchema
);

export default PlannedMountain;