import express from "express";
import TripPlan from "../../models/mountain/TripPlan.js";
import Mountain from "../../models/mountain/Mountain.js";

const router = express.Router();

/**
 * GET /trip-plans?userId=...
 * Fetch all trip plans for the current user, mountains populated
 */
router.get("/", async (req, res) => {
    try {
        const { userId } = req.query;

        const trips = await TripPlan.find({ userId })
            .populate("mountains")
            .sort({ createdAt: -1 });

        return res.json(trips);
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * GET /trip-plans/:id
 * Fetch a single trip plan by Mongo _id, mountains populated
 */
router.get("/:id", async (req, res) => {
    try {
        const trip = await TripPlan.findById(req.params.id).populate("mountains");

        if (!trip) {
            return res.status(404).json({ message: "Trip plan not found" });
        }

        return res.json(trip);
    } catch (err) {
        return res.status(400).json({ message: "Could not fetch trip plan", error: err.message });
    }
});

/**
 * POST /trip-plans
 * Create a trip plan
 * Body: { userId, title, description?, startDate?, endDate? }
 */
router.post("/", async (req, res) => {
    try {
        const { userId, title, description, startDate, endDate } = req.body;

        const created = await TripPlan.create({
            userId,
            title,
            description: description ?? null,
            startDate: startDate ?? null,
            endDate: endDate ?? null,
            mountains: [],
        });

        const populated = await TripPlan.findById(created._id).populate("mountains");

        return res.status(201).json(populated);
    } catch (err) {
        return res.status(400).json({ message: "Could not create trip plan", error: err.message });
    }
});

/**
 * PUT /trip-plans/:id
 * Update title, description, startDate, endDate
 */
router.put("/:id", async (req, res) => {
    try {
        const allowed = ["title", "description", "startDate", "endDate"];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        const updated = await TripPlan.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        }).populate("mountains");

        if (!updated) {
            return res.status(404).json({ message: "Trip plan not found" });
        }

        return res.json(updated);
    } catch (err) {
        return res.status(400).json({ message: "Could not update trip plan", error: err.message });
    }
});

/**
 * DELETE /trip-plans/:id
 */
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await TripPlan.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Trip plan not found" });
        }

        return res.json({ message: "Trip plan deleted", id: deleted._id });
    } catch (err) {
        return res.status(400).json({ message: "Could not delete trip plan", error: err.message });
    }
});

/**
 * POST /trip-plans/:id/mountains
 * Add a mountain to the trip
 * Body: { mountainId }
 */
router.post("/:id/mountains", async (req, res) => {
    try {
        const { mountainId } = req.body;

        const trip = await TripPlan.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: "Trip plan not found" });
        }

        const mountain = await Mountain.findById(mountainId);
        if (!mountain) {
            return res.status(404).json({ message: "Mountain not found" });
        }

        if (trip.mountains.some((m) => m.toString() === mountainId)) {
            return res.status(409).json({ message: "Mountain already in trip" });
        }

        trip.mountains.push(mountainId);
        await trip.save();

        const populated = await TripPlan.findById(trip._id).populate("mountains");
        return res.json(populated);
    } catch (err) {
        return res.status(400).json({ message: "Could not add mountain", error: err.message });
    }
});

/**
 * DELETE /trip-plans/:id/mountains/:mountainId
 * Remove a mountain from the trip
 */
router.delete("/:id/mountains/:mountainId", async (req, res) => {
    try {
        const trip = await TripPlan.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ message: "Trip plan not found" });
        }

        trip.mountains = trip.mountains.filter(
            (m) => m.toString() !== req.params.mountainId
        );
        await trip.save();

        const populated = await TripPlan.findById(trip._id).populate("mountains");
        return res.json(populated);
    } catch (err) {
        return res.status(400).json({ message: "Could not remove mountain", error: err.message });
    }
});

export default router;
