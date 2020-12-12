const router = require('express').Router();
const Munro = require('../model/Munro');
const User = require('../model/User');
const ObjectId = require('mongodb').ObjectID;


router.get('/incomplete/:userId', async (req, res) => {
    let user = await User.findOne({_id: new ObjectId(req.params.userId)}, {munros: 1});
    let userObject = user.toObject();

    const incomplete = await Munro.find(({"_id" : {"$nin" : userObject.munros}}));

    console.log(incomplete.length);

    return res.json(incomplete);
})

router.get('/complete/:userId', async (req, res) => {
    let user = await User.findOne({_id: new ObjectId(req.params.userId)}, {munros: 1});
    let userObject = user.toObject();

    const complete = await Munro.find(({"_id" : {"$in" : userObject.munros}}));

    console.log(complete.length);

    return res.json(complete);
});

module.exports = router;
