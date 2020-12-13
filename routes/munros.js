const router = require('express').Router();
const Munro = require('../model/Munro');
const User = require('../model/User');
const ObjectId = require('mongodb').ObjectID;


router.get('/incomplete/:userId', async (req, res) => {
    let user = await User.findOne({_id: new ObjectId(req.params.userId)}, {munros: 1});
    let userObject = user.toObject();

    const incomplete = await Munro.find(({"_id" : {"$nin" : userObject.munros}}));

    return res.json(incomplete);
})

router.get('/complete/:userId', async (req, res) => {
    let user = await User.findOne({_id: new ObjectId(req.params.userId)}, {munros: 1});
    let userObject = user.toObject();

    const complete = await Munro.find(({"_id" : {"$in" : userObject.munros}}));

    return res.json(complete);
});

router.put('/mark-complete/:userId', async (req, res) => {
    const newMunro = await User.updateOne(
        {_id: new ObjectId(req.params.userId)}, 
        {$addToSet: {munros: req.body.munros[0]}}
    );
    return res.json(newMunro);
});

router.put('/mark-incomplete/:userId', async (req, res) => {
    const removeMunro = await User.updateOne(
        {_id: new ObjectId(req.params.userId)}, 
        {$pull: {munros: req.body.munros[0]}}
    );
    return res.json(newMunro);
});

module.exports = router;
 