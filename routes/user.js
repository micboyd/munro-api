const express = require('express');
const router = express.Router();
const User = require('../models/User');
// const multer = require('multer');
// const { storage } = require('../cloudinary'); 

// const upload = multer({
//     storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//     fileFilter: (req, file, cb) => {
//         if (!file.mimetype.startsWith('image/')) {
//             return cb(new Error('Only image files are allowed!'), false);
//         }
//         cb(null, true);
//     },
// });

router.get('/', async (req, res) => {
    try {
        const Users = await User.find();
        res.json(Users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const User = await User.findById(req.params.id);
        if (!User) return res.status(404).json({ error: 'User not found' });
        res.json(User);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// const multerMiddleware = upload.single('image');

// router.post(
//     '/:id/image',
//     (req, res, next) => {
//         console.log('🔍 Route hit!');
//         console.log('➡️ Params:', JSON.stringify(req.params));
//         next();
//     },
//     (req, res, next) => {
//         multerMiddleware(req, res, function (err) {
//             if (err instanceof multer.MulterError) {
//                 console.error('❌ Multer error:', err.message);
//                 return res.status(400).json({ message: err.message });
//             } else if (err) {
//                 console.error('❌ Unexpected error:', err.message);
//                 return res.status(500).json({ message: err.message });
//             }
//             next();
//         });
//     },
//     (req, res, next) => {
//         console.log('✅ Middleware hit after Multer');
//         if (!req.file) {
//             console.error('❌ No file uploaded!');
//             return res.status(400).json({ message: 'No file uploaded' });
//         }
//         console.log('✅ Uploaded file:', req.file);
//         next();
//     },
//     async (req, res) => {
//         console.log('📸 Route logic');
//         try {
//             const munro = await Munro.findById(req.params.id);
//             if (!munro) return res.status(404).json({ message: 'Munro not found' });

//             munro.image_url = req.file.path;
//             await munro.save();

//             res.json({ message: '✅ Image uploaded to Cloudinary!', munro });
//         } catch (err) {
//             console.error('❌ Upload Error:', err);
//             res.status(500).json({
//                 message: err.message || 'Server error',
//                 error: JSON.stringify(err, null, 2),
//             });
//         }
//     },
// );

module.exports = router;

