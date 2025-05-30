const express = require('express');
const router = express.Router();
const Munro = require('../models/Munro');
const User = require('../models/User');
const multer = require('multer');
const { storage } = require('../cloudinary'); // adjust the path as needed

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

// Create a new Munro
router.post('/', async (req, res) => {
	try {
		const savedMunro = await Munro.save();
		res.status(201).json(savedMunro);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Read all Munros
router.get('/', async (req, res) => {
	try {
		const Munros = await Munro.find();
		res.json(Munros);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all completed Munros
router.get('/completed', async (req, res) => {
	try {
		const completedMunros = await Munro.find({ isCompleted: true });
		res.json(completedMunros);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Read one Munro
router.get('/:id', async (req, res) => {
	try {
		const munro = await Munro.findById(req.params.id);
		if (!munro) return res.status(404).json({ error: 'Munro not found' });
		res.json(munro);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Update a Munro
router.put('/:id', async (req, res) => {
	try {
		const updated = await Munro.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!updated) return res.status(404).json({ error: 'Munro not found' });
		res.json(updated);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Delete a Munro
router.delete('/:id', async (req, res) => {
	try {
		const deleted = await Munro.findByIdAndDelete(req.params.id);
		if (!deleted) return res.status(404).json({ error: 'Munro not found' });
		res.json({ message: 'Munro deleted' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// USER COMPLETED MUNROS

// Get single user completed munro
router.get('/users/:userId/completed/:completedMunroId', async (req, res) => {
	try {
		const user = await User.findById(req.params.userId).populate('completedMunros');
		if (!user) return res.status(404).json({ error: 'User not found' });

		// Find the specific completed Munro by ID
		const munro = user.completedMunros.find(m => m.munroId === req.params.completedMunroId);

		if (!munro) return res.json({ error: 'Completed Munro not found' });

		res.status(201).json(munro);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});


//		const munro = user.completedMunros.find(m => m.munroId === completedMunroId);

// Post single user completed munro with multiple photos
router.post('/users/:userId/completed', upload.array('summitImages'), async (req, res) => {

	console.log('req.files:', req.files);

	try {
		const { userId } = req.params;
		const { munroId, dateCompleted, notes, rating } = req.body;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		// Extract image URLs from uploaded files
		let summitImages = req.files ? req.files.map(file => file.path) : [];

		// Optionally merge with summitImages from body, if present and valid
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
router.put('/users/:userId/completed/:completedMunroId', upload.array('summitImages'), async (req, res) => {
	try {
		const { userId, completedMunroId } = req.params;

		console.log('Updating completed munro for user:', userId, 'Munro ID:', completedMunroId);

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const munro = user.completedMunros.find(m => m.munroId === completedMunroId);// Find by _id (subdocument id)
		// If you must support lookup by munroId:
		// const munro = user.completedMunros.id(completedMunroId) || user.completedMunros.find(m => m.munroId === completedMunroId);

		if (!munro) {
			return res.status(404).json({ error: 'Completed Munro not found' });
		}

		// Safe parse of incoming summitImages from body
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

		// Update with uploaded photos if present
		if (req.files && req.files.length > 0) {
			munro.summitImages = [...(munro.summitImages || []), ...req.files.map(file => file.path)];
		}

		// Merge any images provided via body (e.g. to allow image deletion)
		if (images.length > 0) {
			// Option 1: merge with existing
			munro.summitImages = [...(munro.summitImages || []), ...images];
			// Option 2: replace
			// munro.summitImages = images;
		}

		// Update other fields except summitImages (to avoid accidental object assignment)
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
router.delete('/users/:userId/completed/:completedMunroId', async (req, res) => {
	try {
		const { userId, completedMunroId } = req.params;

		const user = await User.findById(userId);
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
router.get('/users/:userId/completed', async (req, res) => {
	try {
		const user = await User.findById(req.params.userId).populate('completedMunros');
		if (!user) return res.status(404).json({ error: 'User not found' });

		res.json(user.completedMunros);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
