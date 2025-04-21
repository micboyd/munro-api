const express = require('express');
const router = express.Router();
const Munro = require('../models/Munro');
const User = require('../models/User');
const multer = require('multer');
const { storage } = require('../cloudinary'); // adjust the path as needed

const upload = multer({
	storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
		const Munro = await Munro.findById(req.params.id);
		if (!Munro) return res.status(404).json({ error: 'Munro not found' });
		res.json(Munro);
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

// Add multiple Munros to a user's completed Munros list (replaces the list)
router.put('/:userId/completed', async (req, res) => {
	try {
		console.log(req.body);

		if (!Array.isArray(req.body)) {
			return res.status(400).json({ error: 'munroIds must be an array' });
		}

		const user = await User.findById(req.params.userId);
		if (!user) return res.status(404).json({ error: 'User not found' });

		// Convert all ObjectIds to strings and deduplicate
		const uniqueMunroIds = [...new Set(req.body.map(id => id.toString()))];

		// Validate Munro IDs exist in DB
		const foundMunros = await Munro.find({ _id: { $in: uniqueMunroIds } });
		if (foundMunros.length !== uniqueMunroIds.length) {
			return res.status(400).json({ error: 'Some Munro IDs are invalid' });
		}

		// Replace completedMunros with new list
		user.completedMunros = uniqueMunroIds;

		await user.save();

		res.json({ message: 'Completed Munros list updated', completedMunros: user.completedMunros });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get all completed Munros for a specific user
router.get('/:userId/completed', async (req, res) => {
	try {
		// Find the user
		const user = await User.findById(req.params.userId).populate('completedMunros');
		if (!user) return res.status(404).json({ error: 'User not found' });

		// Return the completed Munros
		res.json(user.completedMunros);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

const multerMiddleware = upload.single('image');

router.post(
	'/:id/image',
	(req, res, next) => {
		console.log('🔍 Route hit!');
		console.log('➡️ Params:', JSON.stringify(req.params));
		next();
	},
	(req, res, next) => {
		multerMiddleware(req, res, function (err) {
			if (err instanceof multer.MulterError) {
				console.error('❌ Multer error:', err.message);
				return res.status(400).json({ message: err.message });
			} else if (err) {
				console.error('❌ Unexpected error:', err.message);
				return res.status(500).json({ message: err.message });
			}
			next();
		});
	},
	(req, res, next) => {
		console.log('✅ Middleware hit after Multer');
		if (!req.file) {
			console.error('❌ No file uploaded!');
			return res.status(400).json({ message: 'No file uploaded' });
		}
		console.log('✅ Uploaded file:', req.file);
		next();
	},
	async (req, res) => {
		console.log('📸 Route logic');
		try {
			const munro = await Munro.findById(req.params.id);
			if (!munro) return res.status(404).json({ message: 'Munro not found' });

			munro.image_url = req.file.path;
			await munro.save();

			res.json({ message: '✅ Image uploaded to Cloudinary!', munro });
		} catch (err) {
			console.error('❌ Upload Error:', err);
			res.status(500).json({
				message: err.message || 'Server error',
				error: JSON.stringify(err, null, 2),
			});
		}
	},
);

module.exports = router;

