const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', async(req, res) => {
    try {
        const {
            username,
            password,
            firstname,
            lastname
        } = req.body;

        const existingUser = await User.findOne({
            username
        });

        if (existingUser) {
            return res.status(400).json({
                msg: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            firstname,
            lastname,
            username,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            msg: 'User registered'
        });

    } catch(err) {
        res.status(500).json({
            error: err.message
        });
    }
});

router.post('/login', async(req, res) => {
    try {
        const {
            username,
            password
        } = req.body;

        const user = await User.findOne({
            username
        });

        if (!user) {
            return res.status(400).json({
                msg: 'User not found'
            });
        };

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                msg: 'Invalid credentials'
            });
        };

        const token = jwt.sign({
            id: user._id
        },
        process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname, 
            }
        });

    } catch(err) {
        res.status(500).json({
            error: err.message
        });
    }
});

// router.get('/protected', authMiddleware, (req, res) => {
//     res.json({ msg: 'This is protected content', userId: req.user.id });
//   });

module.exports = router;