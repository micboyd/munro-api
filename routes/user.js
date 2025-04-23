const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const { storage } = require('../cloudinary');

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

router.put('/:id', async (req, res) => {
	try {
		const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!updated) return res.status(404).json({ error: 'User not found' });
		res.json(updated);
		console.log('Updated user:', updated);
	} catch (err) {
		res.status(400).json({ error: err.message });
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
			const user = await User.findById(req.params.id);
			if (!user) return res.status(404).json({ message: 'user not found' });

			user.profileImage = req.file.path;
			await user.save();

			res.json({ message: '✅ Image uploaded to Cloudinary!', user });
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

