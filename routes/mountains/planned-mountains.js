import express from "express";
import PlannedMountain from "../../models/mountain/PlannedMountain.js";

const router = express.Router();

// Helper to shape API response (no mountainId exposed)
const toResponse = (doc) => ({
    _id: doc._id,
    userId: doc.userId,
    mountain: doc.mountainId, // populated Mountain doc
    plannedDate: doc.plannedDate,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});

/**
 * GET /planned-mountains?userId=...&page=1&limit=10&sort=date_asc&all=true
 * Returns populated `mountain` (full Mountain doc), no `mountainId` in response.
 */
router.get("/", async (req, res) => {
    try {
        const { userId, sort, all } = req.query;

        const filter = {};
        if (userId) filter.userId = userId;

        let sortOption = { plannedDate: -1 };
        if (sort === "date_asc") sortOption = { plannedDate: 1 };
        if (sort === "date_desc") sortOption = { plannedDate: -1 };
        if (sort === "newest") sortOption = { createdAt: -1 };
        if (sort === "oldest") sortOption = { createdAt: 1 };

        if (all === "true") {
            const planned = await PlannedMountain.find(filter)
                .sort(sortOption)
                .populate("mountainId");

            if (!planned.length) {
                return res.status(404).json({ message: "No planned mountains found" });
            }

            const data = planned.map(toResponse);
            return res.json({ data, total: data.length });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const total = await PlannedMountain.countDocuments(filter);

        const planned = await PlannedMountain.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate("mountainId");

        if (!planned.length) {
            return res.status(404).json({ message: "No planned mountains found" });
        }

        const data = planned.map(toResponse);

        return res.json({
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        return res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});

/**
 * GET /planned-mountains/:id
 */
router.get("/:id", async (req, res) => {
    try {
        const planned = await PlannedMountain.findById(req.params.id).populate(
            "mountainId"
        );

        if (!planned) {
            return res.status(404).json({ message: "Planned mountain not found" });
        }

        return res.json(toResponse(planned));
    } catch (err) {
        return res.status(400).json({
            message: "Could not fetch planned mountain",
            error: err.message,
        });
    }
});

/**
 * POST /planned-mountains
 * Body: { userId, mountainId, plannedDate }
 * Response: { userId, mountain: <populated>, plannedDate, ... }
 */
router.post("/", async (req, res) => {
    try {
        const { userId, mountainId, plannedDate } = req.body;

        const created = await PlannedMountain.create({
            userId,
            mountainId,
            plannedDate,
        });

        const populated = await PlannedMountain.findById(created._id).populate(
            "mountainId"
        );

        return res.status(201).json(toResponse(populated));
    } catch (err) {
        return res.status(400).json({
            message: "Could not create planned mountain",
            error: err.message,
        });
    }
});

/**
 * PUT /planned-mountains/:id
 * Allows updating: mountainId, plannedDate
 * Response: populated `mountain`
 */
router.put("/:id", async (req, res) => {
    try {
        const allowed = ["mountainId", "plannedDate"];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const updated = await PlannedMountain.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate("mountainId");

        if (!updated) {
            return res.status(404).json({ message: "Planned mountain not found" });
        }

        return res.json(toResponse(updated));
    } catch (err) {
        return res.status(400).json({
            message: "Could not update planned mountain",
            error: err.message,
        });
    }
});

/**
 * DELETE /planned-mountains/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await PlannedMountain.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Planned mountain not found" });
        }

        return res.json({
            message: "Planned mountain deleted",
            id: deleted._id,
        });
    } catch (err) {
        return res.status(400).json({
            message: "Could not delete planned mountain",
            error: err.message,
        });
    }
});

export default router;