const router = require('express').Router();
const Munro = require('../model/Munro');
const verify = require('./verifyToken');

router.get('/', verify, async (req, res) => {
    const munro = await Munro.find();
    return res.json(munro);
});

module.exports = router;