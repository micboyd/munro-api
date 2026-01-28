import UserProfile from "../../models/profile/UserProfile.js";
import express from "express";

const router = express.Router();

/**
 * GET: fetch profile by userId (your schema has userId: String)
 * GET /user-profile/:userId
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const profile = await UserProfile.findOne({ userId });
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        return res.json(profile);
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * POST: create profile (option A: userId in URL)
 * POST /user-profile/
 */
router.post("/", async (req, res) => {
    try {
        const { userId, firstName, lastName, bio, profileImage } = req.body;

        const existing = await UserProfile.findOne({ userId });
        if (existing) {
            return res.status(409).json({ message: "Profile already exists for this userId" });
        }

        const created = await UserProfile.create({
            userId,
            firstName,
            lastName,
            bio,
            profileImage,
        });

        return res.status(201).json(created);

    } catch (err) {
        return res.status(400).json({ message: "Could not create profile", error: err.message });
    }
});

/**
 * PATCH: update profile by Mongo _id
 * PATCH /user-profile/:id
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const allowed = ["firstName", "lastName", "bio", "profileImage", "userId"];
        
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const updated = await UserProfile.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updated) return res.status(404).json({ message: "Profile not found" });

        return res.json(updated);
    } catch (err) {
        return res.status(400).json({ message: "Could not update profile", error: err.message });
    }
});

/**
 * DELETE: delete profile by Mongo _id
 * DELETE /user-profile/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await UserProfile.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Profile not found" });

        return res.json({ message: "Profile deleted", id: deleted._id });
    } catch (err) {
        return res.status(400).json({ message: "Could not delete profile", error: err.message });
    }
});

export default router;
