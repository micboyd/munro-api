import CompletedMountain from "../../models/mountain/CompletedMountain.js";
import express from "express";

const router = express.Router();

/**
 * GET all completed mountains for a user
 * GET /completed-mountains/:userId
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const completedMountains = await CompletedMountain.find({ userId })
            .sort({ dateCompleted: -1, createdAt: -1 });

        if (!completedMountains.length) {
            return res
                .status(404)
                .json({ message: "No completed mountains found" });
        }

        return res.json(completedMountains);
    } catch (err) {
        return res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});

/**
 * POST: mark mountain as completed
 * POST /completed-mountains
 */
router.post("/", async (req, res) => {
    try {
        const {
            userId,
            mountainId,
            rating,
            dateCompleted,
            notes,
            summitPhotos,
        } = req.body;

        const created = await CompletedMountain.create({
            userId,
            mountainId,
            rating,
            dateCompleted,
            notes,
            summitPhotos,
        });

        return res.status(201).json(created);
    } catch (err) {
        return res.status(400).json({
            message: "Could not create completed mountain",
            error: err.message,
        });
    }
});

/**
 * PUT: update completed mountain by Mongo _id
 * PUT /completed-mountains/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const allowed = [
            "rating",
            "dateCompleted",
            "notes",
            "summitPhotos",
        ];

        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const updated = await CompletedMountain.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return res
                .status(404)
                .json({ message: "Completed mountain not found" });
        }

        return res.json(updated);
    } catch (err) {
        return res.status(400).json({
            message: "Could not update completed mountain",
            error: err.message,
        });
    }
});

/**
 * DELETE: delete completed mountain by Mongo _id
 * DELETE /completed-mountains/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await CompletedMountain.findByIdAndDelete(id);
        if (!deleted) {
            return res
                .status(404)
                .json({ message: "Completed mountain not found" });
        }

        return res.json({
            message: "Completed mountain deleted",
            id: deleted._id,
        });
    } catch (err) {
        return res.status(400).json({
            message: "Could not delete completed mountain",
            error: err.message,
        });
    }
});

export default router;
