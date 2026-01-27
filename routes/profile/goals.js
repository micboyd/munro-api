import express from "express";
import Goal from "../../models/profile/Goal.js";

const router = express.Router();

/**
 * GET: fetch all goals by userId
 * GET /goals/:userId
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
        if (!goals.length) {
            return res.status(404).json({ message: "No goals found for this user" });
        }

        return res.json(goals);
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * POST: create a goal
 * POST /goals
 */
router.post("/", async (req, res) => {
    try {
        const {
            userId,
            title,
            description,
            status,
            progressPercent,
            completedAt,
            success,
        } = req.body;

        const created = await Goal.create({
            userId,
            title,
            description,
            status,
            progressPercent,
            completedAt,
            success,
        });

        return res.status(201).json(created);
    } catch (err) {
        return res.status(400).json({ message: "Could not create goal", error: err.message });
    }
});

/**
 * PUT: update goal by Mongo _id
 * PUT /goals/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const allowed = [
            "title",
            "description",
            "status",
            "progressPercent",
            "completedAt",
            "success",
            "userId",
        ];

        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const updated = await Goal.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updated) return res.status(404).json({ message: "Goal not found" });

        return res.json(updated);
    } catch (err) {
        return res.status(400).json({ message: "Could not update goal", error: err.message });
    }
});

/**
 * DELETE: delete goal by Mongo _id
 * DELETE /goals/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Goal.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Goal not found" });

        return res.json({ message: "Goal deleted", id: deleted._id });
    } catch (err) {
        return res.status(400).json({ message: "Could not delete goal", error: err.message });
    }
});

export default router;
