import express from "express";
import Mountain from "../../models/mountain/Mountain.js";

const router = express.Router();

/**
 * GET /mountains?category=munro
 */
router.get("/", async (req, res) => {
    try {
        const { category } = req.query;

        const filter = {};
        if (category) filter.category = category;

        const mountains = await Mountain.find(filter)
            .sort({ createdAt: -1 });

        if (!mountains.length) {
            return res.status(404).json({ message: "No mountains found" });
        }

        return res.json(mountains);
    } catch (err) {
        return res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});

/**
 * POST: create a mountain
 * POST /mountains
 */
router.post("/", async (req, res) => {
    try {
        const {
            name,
            category,
            country,
            meaning,
            height,
            latitude,
            longitude,
            region,
            imageUrl,
        } = req.body;

        const created = await Mountain.create({
            name,
            category,
            country,
            meaning,
            height,
            latitude,
            longitude,
            region,
            imageUrl,
        });

        return res.status(201).json(created);
    } catch (err) {
        return res.status(400).json({
            message: "Could not create mountain",
            error: err.message,
        });
    }
});

/**
 * PUT: update mountain by Mongo _id
 * PUT /mountains/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const allowed = [
            "name",
            "category",
            "country",
            "meaning",
            "height",
            "latitude",
            "longitude",
            "region",
            "imageUrl",
        ];

        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const updated = await Mountain.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updated) {
            return res.status(404).json({ message: "Mountain not found" });
        }

        return res.json(updated);
    } catch (err) {
        return res.status(400).json({
            message: "Could not update mountain",
            error: err.message,
        });
    }
});

/**
 * DELETE: delete mountain by Mongo _id
 * DELETE /mountains/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Mountain.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Mountain not found" });
        }

        return res.json({
            message: "Mountain deleted",
            id: deleted._id,
        });
    } catch (err) {
        return res.status(400).json({
            message: "Could not delete mountain",
            error: err.message,
        });
    }
});

export default router;
