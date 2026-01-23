import express from "express";
import Munro from "../models/Munro.js";
// import User from "../models/User.js"; // unused in this file currently
// import multer from "multer";
// import { storage } from "../cloudinary.js";

const router = express.Router();

// If you later add image upload endpoints for Munros, uncomment:
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (_req, file, cb) => {
//     if (!file.mimetype?.startsWith("image/")) {
//       return cb(new Error("Only image files are allowed!"), false);
//     }
//     cb(null, true);
//   },
// });

// Create a new Munro
router.post("/", async (req, res) => {
	try {
		const munro = new Munro(req.body);
		const savedMunro = await munro.save();
		res.status(201).json(savedMunro);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Read all Munros
router.get("/", async (_req, res) => {
	try {
		const munros = await Munro.find();
		res.json(munros);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all completed Munros
router.get("/completed", async (_req, res) => {
	try {
		const completedMunros = await Munro.find({ isCompleted: true });
		res.json(completedMunros);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Read one Munro
router.get("/:id", async (req, res) => {
	try {
		const munro = await Munro.findById(req.params.id);
		if (!munro) return res.status(404).json({ error: "Munro not found" });
		res.json(munro);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update a Munro
router.put("/:id", async (req, res) => {
	try {
		const updated = await Munro.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!updated) return res.status(404).json({ error: "Munro not found" });
		res.json(updated);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Delete a Munro
router.delete("/:id", async (req, res) => {
	try {
		const deleted = await Munro.findByIdAndDelete(req.params.id);
		if (!deleted) return res.status(404).json({ error: "Munro not found" });
		res.json({ message: "Munro deleted" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
