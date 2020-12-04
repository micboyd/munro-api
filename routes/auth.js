const router = require('express').Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation } = require('../validation');
const ObjectId = require('mongodb').ObjectId; 

router.post('/register', async (req, res) => {

    // Validate the user
    const {error} = registerValidation(req.body);

    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // Check if user already exists
    const emailExists = await User.findOne({
        email: req.body.email
    })

    if (emailExists) {
        return res.status(400).send('Email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt); 

    // Create a new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    });

    try {
        const savedUser = await user.save();
        res.send({
            user: user._id
        });
    } catch (err) {
        res.status(400).send(err);
    }
});

router.post('/login', async (req, res) => {

    const {error} = loginValidation(req.body);

    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // Check if user already exists
    const user = await User.findOne({
        email: req.body.email
    });

    if (!user) {
        return res.status(400).send('Email or password is incorrect');
    }

    // Password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);

    if (!validPass) {
        res.status(400).send('Email or password is incorrect');
    }

    // Create & assign a token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('auth-token', token).json({token : token, user : user._id});

    // Succesful Login
    res.send('Logged in');
});

router.get('/details/:userId', async (req, res) => {
    let details = await User.findOne({_id: new ObjectId(req.params.userId)})
    res.send(details);
});

router.get('/munros/:userId', async (req, res) => {
    let details = await User.findOne({_id: new ObjectId(req.params.userId), munros: 1})
    res.send(details);
});

module.exports = router;