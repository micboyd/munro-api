import CompletedMountain from "../../models/mountain/CompletedMountain.js";
import PlannedMountain from "../../models/mountain/PlannedMountain.js";
import TripPlan from "../../models/mountain/TripPlan.js";
import express from "express";

const router = express.Router();

/**
 * GET /recent-activities?userId=...&limit=10
 * Returns a merged, chronologically-sorted list of recent user activity:
 *   - type "completed"    : mountain marked as completed
 *   - type "planned"      : mountain added to planned list
 *   - type "trip_created" : trip plan created
 *
 * Query params:
 *   userId  (required) - the user to fetch activity for
 *   limit   (optional, default 10) - max number of activities to return
 */
router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;
        const limit = parseInt(req.query.limit, 10) || 10;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        // CompletedMountain stores mountainId as String — convert to ObjectId for the join
        const completedPipeline = [
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
                $project: {
                    type: { $literal: "completed" },
                    createdAt: 1,
                    dateCompleted: 1,
                    rating: 1,
                    notes: 1,
                    summitPhotos: 1,
                    mountain: 1,
                },
            },
        ];

        // PlannedMountain stores mountainId as ObjectId — direct join
        const plannedPipeline = [
            { $match: { userId } },
            {
                $lookup: {
                    from: "mountains",
                    localField: "mountainId",
                    foreignField: "_id",
                    as: "mountain",
                },
            },
            { $unwind: "$mountain" },
            {
                $project: {
                    type: { $literal: "planned" },
                    createdAt: 1,
                    plannedDate: 1,
                    mountain: 1,
                },
            },
        ];

        const tripPipeline = [
            { $match: { userId } },
            {
                $project: {
                    type: { $literal: "trip_created" },
                    createdAt: 1,
                    title: 1,
                },
            },
        ];

        const [completed, planned, trips] = await Promise.all([
            CompletedMountain.aggregate(completedPipeline),
            PlannedMountain.aggregate(plannedPipeline),
            TripPlan.aggregate(tripPipeline),
        ]);

        const activities = [...completed, ...planned, ...trips]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);

        return res.json({ data: activities, total: activities.length });
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
