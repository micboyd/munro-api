const router = require('express').Router();

const Munro = require('../model/Munro');
const User = require('../model/User');

/* Routes */

router.get('/all', async (res) => {
    const munros = await Munro.find();
    return res.json(munros);
})

router.get('/complete/:userId', async (req, res) => {
    let user = await User.findOne({_id: req.params.userId}, {munros: 1});
    let userObject = user.toObject();

    const complete = await Munro.find(({"_id" : {"$in" : userObject.munros}}));

    return res.json(complete);
});

module.exports = router;
 