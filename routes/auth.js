const router = require('express').Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation } = require('../validation');

/* End-point: Register */
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
        firstname: req.body.firstname,
        surname: req.body.surname,
        isAdmin: req.body.isAdmin,
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

/* End-point: Login */
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
    res.status(200).header('auth-token', token).json({
        token : token, 
        userid: user._id,
        username: user.name
    });
});

router.get('/details/:userId', async (req, res) => {
    let user = await User.findOne({_id: req.params.userId});
    return res.json(user);
});

module.exports = router;