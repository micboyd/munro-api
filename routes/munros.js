const router = require('express').Router();
const Munro = require('../model/Munro');

router.get('/', async (req, res) => {
    const munro = await Munro.find();
    return res.json(munro);
});

module.exports = router;