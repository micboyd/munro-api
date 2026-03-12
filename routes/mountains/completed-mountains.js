import CompletedMountain from "../../models/mountain/CompletedMountain.js";
import { upload, uploadSummitPhotosToCloudinary } from "../../middleware/uploadToCloudinary.js";
import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Run multer for every request.
// - Non-multipart (JSON) requests: multer is a no-op and req.body from express.json() is preserved.
// - Multipart requests: multer parses text fields into req.body and files into req.files.
// We intercept the callback so that a multer error never silently empties req.body
// and skips the route handler.
function parseFormData(req, res, next) {
    upload.array("summitPhotos", 10)(req, res, function (err) {
        if (!err) return next();

        // LIMIT_UNEXPECTED_FILE means a file arrived under a different field name.
        // Text fields (userId, mountainId…) are already in req.body at this point,
        // so we can safely continue without the files.
        if (err.code === "LIMIT_UNEXPECTED_FILE") return next();

        // Any other multer/busboy error (e.g. file too large) is a real failure.
        return res.status(400).json({ message: "Upload error", error: err.message });
    });
}

// Shape an aggregation result doc for API response
const toAggResponse = (doc) => ({
    _id: doc._id,
    userId: doc.userId,
    mountainId: doc.mountainId,
    mountain: doc.mountain,
    notes: doc.notes,
    dateCompleted: doc.dateCompleted,
    rating: doc.rating,
    summitPhotos: doc.summitPhotos,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});

/**
 * GET /completed-mountains?userId=...&page=1&limit=9&sort=date_desc&all=true&search=ben
 * Supports the same filters/pagination as GET /planned-mountains:
 *   - search     : case-insensitive regex on mountain name
 *   - sort       : date_asc | date_desc | height_desc | height_asc
 *   - page/limit : pagination (default limit 9)
 *   - all=true   : skip pagination, return everything
 * Returns populated `mountain` (full Mountain doc).
 * Note: mountainId is stored as String so we use $toObjectId in the $lookup pipeline.
 */
router.get("/", async (req, res) => {
    try {
        const { userId, sort, all, search } = req.query;

        const filter = {};
        if (userId) filter.userId = userId;

        let sortOption = { dateCompleted: -1 };
        if (sort === "date_asc")    sortOption = { dateCompleted: 1 };
        if (sort === "date_desc")   sortOption = { dateCompleted: -1 };
        if (sort === "height_desc") sortOption = { "mountain.height": -1 };
        if (sort === "height_asc")  sortOption = { "mountain.height": 1 };

        // mountainId is stored as String; Mountain._id is ObjectId — convert for the join
        const basePipeline = [
            { $match: filter },
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
        ];

        if (search) {
            basePipeline.push({
                $match: { "mountain.name": { $regex: search, $options: "i" } },
            });
        }

        basePipeline.push({ $sort: sortOption });

        if (all === "true") {
            const completed = await CompletedMountain.aggregate(basePipeline);
            return res.json({ data: completed.map(toAggResponse), total: completed.length });
        }

        const page  = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 9;
        const skip  = (page - 1) * limit;

        const [countResult] = await CompletedMountain.aggregate([
            ...basePipeline,
            { $count: "total" },
        ]);
        const total = countResult?.total ?? 0;

        const completed = await CompletedMountain.aggregate([
            ...basePipeline,
            { $skip: skip },
            { $limit: limit },
        ]);

        return res.json({
            data: completed.map(toAggResponse),
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
 * GET /completed-mountains/:id
 * Returns a single completed mountain with populated `mountain`.
 */
router.get("/:id", async (req, res) => {
    try {
        const [doc] = await CompletedMountain.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
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
        ]);

        if (!doc) {
            return res.status(404).json({ message: "Completed mountain not found" });
        }

        return res.json(toAggResponse(doc));
    } catch (err) {
        return res.status(400).json({
            message: "Could not fetch completed mountain",
            error: err.message,
        });
    }
});

/**
 * POST: mark mountain as completed
 * POST /completed-mountains
 * Content-Type: multipart/form-data  OR  application/json
 * Fields: userId, mountainId, rating, dateCompleted, notes
 * Files:  summitPhotos (up to 10 image files)
 */
router.post(
    "/",
    parseFormData,
    uploadSummitPhotosToCloudinary,
    async (req, res) => {
        try {
            const { userId, mountainId, rating, dateCompleted, notes } = req.body;

            // Combine any existing URLs from body with newly uploaded ones
            const bodyPhotos = req.body.summitPhotos
                ? [].concat(req.body.summitPhotos)
                : [];
            const uploadedUrls = req.uploadedPhotos
                ? req.uploadedPhotos.map((p) => p.url)
                : [];

            const created = await CompletedMountain.create({
                userId,
                mountainId,
                rating,
                dateCompleted,
                notes,
                summitPhotos: [...bodyPhotos, ...uploadedUrls],
            });

            // Return with mountain populated so the frontend has full data
            const [doc] = await CompletedMountain.aggregate([
                { $match: { _id: created._id } },
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
            ]);

            return res.status(201).json(doc ? toAggResponse(doc) : created);
        } catch (err) {
            return res.status(400).json({
                message: "Could not create completed mountain",
                error: err.message,
            });
        }
    }
);

/**
 * PUT: update completed mountain by Mongo _id
 * PUT /completed-mountains/:id
 * Content-Type: multipart/form-data  OR  application/json
 * Fields: rating, dateCompleted, notes, summitPhotos (pass the full desired URL array to replace it)
 * Files:  summitPhotos (up to 10 image files — appended to whatever summitPhotos ends up being)
 */
router.put(
    "/:id",
    parseFormData,
    uploadSummitPhotosToCloudinary,
    async (req, res) => {
        try {
            const { id } = req.params;

            const updates = {};
            for (const key of ["rating", "dateCompleted", "notes"]) {
                if (req.body[key] !== undefined) {
                    updates[key] = req.body[key];
                }
            }

            const uploadedUrls = req.uploadedPhotos
                ? req.uploadedPhotos.map((p) => p.url)
                : [];

            const hasSummitPhotosInBody = req.body.summitPhotos !== undefined;

            let updated;

            if (hasSummitPhotosInBody) {
                // Replace the array with what was sent, then append any new uploads
                const bodyPhotos = [].concat(req.body.summitPhotos);
                updates.summitPhotos = [...bodyPhotos, ...uploadedUrls];
                updated = await CompletedMountain.findByIdAndUpdate(id, updates, {
                    new: true,
                    runValidators: true,
                });
            } else if (uploadedUrls.length > 0) {
                // Just push new photos without touching the existing array
                updated = await CompletedMountain.findByIdAndUpdate(
                    id,
                    { $set: updates, $push: { summitPhotos: { $each: uploadedUrls } } },
                    { new: true, runValidators: true }
                );
            } else {
                updated = await CompletedMountain.findByIdAndUpdate(id, updates, {
                    new: true,
                    runValidators: true,
                });
            }

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
    }
);

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
