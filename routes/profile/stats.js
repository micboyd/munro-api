import CompletedMountain from "../../models/mountain/CompletedMountain.js";
import express from "express";

const router = express.Router();

/**
 * GET /stats?userId=...
 * Returns profile stats for a user:
 *   - metersClimbed  : total height of all completed mountains
 *   - completedHikes : number of completed mountains
 *   - averageRating  : average rating across completed mountains (null if none rated)
 */
router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const pipeline = [
            { $match: { userId } },
            {
                $lookup: {
                    from: "mountains",
                    let: { mid: "$mountainId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$mid" }] } } },
                    ],
                    as: "mountain",
                },
            },
            { $unwind: "$mountain" },
            {
                $group: {
                    _id: null,
                    metersClimbed: { $sum: "$mountain.height" },
                    completedHikes: { $sum: 1 },
                    averageRating: { $avg: "$rating" },
                },
            },
            {
                $project: {
                    _id: 0,
                    metersClimbed: 1,
                    completedHikes: 1,
                    averageRating: { $round: ["$averageRating", 1] },
                },
            },
        ];

        const [result] = await CompletedMountain.aggregate(pipeline);

        return res.json(
            result ?? { metersClimbed: 0, completedHikes: 0, averageRating: null }
        );
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
