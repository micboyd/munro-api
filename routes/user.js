import express from "express";
import multer from "multer";
import User from "../models/User.js";
import { storage } from "../cloudinary.js";

const router = express.Router();


const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (!file.mimetype.startsWith('image/')) {
			return cb(new Error('Only image files are allowed!'), false);
		}
		cb(null, true);
	},
});

router.get('/', async (req, res) => {
	try {
		const users = await User.find();
		res.json(users);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.get('/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json({ error: 'User not found' });
		res.json({
			id: user._id,
			firstname: user.firstname,
			lastname: user.lastname,
			username: user.username,
			profileImage: user.profileImage,
			bio: user.bio,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

router.put('/:id', upload.single('image'), async (req, res) => {
	try {
		const updateData = { ...req.body };

		if (req.file) {
			updateData.profileImage = req.file.path;
		}

		const updated = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
		if (!updated) return res.status(404).json({ error: 'User not found' });

		res.json(updated);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// USER COMPLETED MUNROS

// Get single user completed munro
router.get('/:id/completed/:completedMunroId', async (req, res) => {
	try {
		const user = await User.findById(req.params.id).populate('completedMunros');
		if (!user) return res.status(404).json({ error: 'User not found' });

		const munro = user.completedMunros.find(m => m.munroId === req.params.completedMunroId);

		if (!munro) return res.json({ error: 'Completed Munro not found' });

		res.status(201).json(munro);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Post single user completed munro with multiple photos
router.post('/:id/completed', upload.array('summitImages'), async (req, res) => {
	try {
		const { id } = req.params;
		const { munroId, dateCompleted, notes, rating } = req.body;

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		let summitImages = req.files ? req.files.map(file => file.path) : [];

		if (req.body.summitImages) {
			let images = req.body.summitImages;
			if (typeof images === 'string') {
				try {
					images = JSON.parse(images);
				} catch {
					images = [images];
				}
			}
			if (Array.isArray(images)) {
				// Only strings
				summitImages = [...summitImages, ...images.filter(x => typeof x === 'string')];
			}
		}

		const newCompletedMunro = user.completedMunros.create({
			munroId,
			dateCompleted: dateCompleted || new Date(),
			notes: notes || '',
			rating: rating || 0,
			summitImages,
		});

		user.completedMunros.push(newCompletedMunro);
		await user.save();
		res.status(201).json(newCompletedMunro);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update single user completed munro with multi image support
router.put('/:id/completed/:completedMunroId', upload.array('summitImages'), async (req, res) => {
	try {
		const { id, completedMunroId } = req.params;

		console.log('Updating completed munro for user:', id, 'Munro ID:', completedMunroId);

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const munro = user.completedMunros.find(m => m.munroId === completedMunroId);// Find by _id (subdocument id)

		if (!munro) {
			return res.status(404).json({ error: 'Completed Munro not found' });
		}

		let images = [];

		if (req.body.summitImages) {
			let val = req.body.summitImages;
			if (typeof val === 'string') {
				try {
					val = JSON.parse(val);
				} catch {
					val = [val];
				}
			}
			if (Array.isArray(val)) {
				images = val.filter(x => typeof x === 'string');
			}
		}

		if (req.files && req.files.length > 0) {
			munro.summitImages = [...(munro.summitImages || []), ...req.files.map(file => file.path)];
		}

		if (images.length > 0) {
			munro.summitImages = [...(munro.summitImages || []), ...images];
		}

		const allowedFields = ['munroId', 'dateCompleted', 'notes', 'rating'];

		allowedFields.forEach(field => {
			if (req.body[field] !== undefined) munro[field] = req.body[field];
		});

		await user.save();

		res.json({
			message: 'Completed Munro updated successfully',
			munro,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Delete single user completed munro
router.delete('/:id/completed/:completedMunroId', async (req, res) => {
	try {
		const { id, completedMunroId } = req.params;

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const completedMunro = user.completedMunros.id(completedMunroId);
		if (!completedMunro) {
			return res.status(404).json({ error: 'Completed Munro not found' });
		}

		// Prefer this:
		user.completedMunros.pull(completedMunroId);
		await user.save();

		res.json({
			message: 'Completed Munro deleted successfully',
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all user completed munros
router.get('/:id/completed', async (req, res) => {
	try {
		const user = await User.findById(req.params.id).populate('completedMunros');
		if (!user) return res.status(404).json({ error: 'User not found' });

		res.json(user.completedMunros);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;

