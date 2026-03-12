import CompletedMountain from "../../models/mountain/CompletedMountain.js";
import { upload, uploadSummitPhotosToCloudinary } from "../../middleware/uploadToCloudinary.js";
import express from "express";

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
 * Content-Type: multipart/form-data
 * Fields: userId, mountainId, rating, dateCompleted, notes, summitPhotos (URLs)
 * Files:  photos (up to 10 image files)
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

            return res.status(201).json(created);
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
 * Content-Type: multipart/form-data
 * Fields: rating, dateCompleted, notes, summitPhotos (pass the full desired URL array to replace it)
 * Files:  photos (up to 10 image files — appended to whatever summitPhotos ends up being)
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
