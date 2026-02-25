import express from "express";
import Mountain from "../../models/mountain/Mountain.js";

const router = express.Router();

/**
 * GET: get all unique mountain categories
 * GET /mountains/categories
 */
/**
 * GET: get all unique mountain categories with counts
 * GET /mountains/categories
 */
router.get("/categories", async (req, res) => {
    try {
        const categories = await Mountain.aggregate([
            { $unwind: "$category" },

            {
                $match: {
                    category: { $type: "string", $ne: "" }
                }
            },

            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },

            { $sort: { _id: 1 } },

            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    count: 1
                }
            }
        ]);

        if (!categories.length) {
            return res.status(404).json({ message: "No categories found" });
        }

        return res.json(categories);

    } catch (err) {
        return res.status(500).json({
            message: "Could not fetch categories",
            error: err.message,
        });
    }
});

/**
 * GET /mountains?category=munro&search=ben&page=1&sort=height_desc
 */
router.get("/", async (req, res) => {
    try {
        const { category, search, all, sort } = req.query;

        const filter = {};

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        /* ------------------ SORTING ------------------ */
        let sortOption = { createdAt: -1 }; // default (newest)

        if (sort === "height_desc") {
            sortOption = { height: -1 };
        }

        if (sort === "height_asc") {
            sortOption = { height: 1 };
        }

        if (sort === "oldest") {
            sortOption = { createdAt: 1 };
        }
        /* --------------------------------------------- */

        if (all === "true") {
            const mountains = await Mountain.find(filter)
                .sort(sortOption);

            if (!mountains.length) {
                return res.status(404).json({ message: "No mountains found" });
            }

            return res.json({
                data: mountains,
                total: mountains.length
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 9;
        const skip = (page - 1) * limit;

        const total = await Mountain.countDocuments(filter);

        const mountains = await Mountain.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        if (!mountains.length) {
            return res.status(404).json({ message: "No mountains found" });
        }

        return res.json({
            data: mountains,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });

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
