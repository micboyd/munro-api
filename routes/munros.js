const router = require('express').Router();
const Munro = require('../model/Munro');
const User = require('../model/User');


// Returns all completed munros - Param: User ID
router.get('/complete/:userId', async (req, res) => {
    let user = await User.findOne({_id: req.params.userId}, {munros: 1});
    let userObject = user.toObject();

    const complete = await Munro.find(({"_id" : {"$in" : userObject.munros}}));

    return res.json(complete);
});



module.exports = router;

// Returns all incomplete munros - Param: User ID
router.get('/incomplete/:userId', async (req, res) => {
    let user = await User.findOne({_id: req.params.userId}, {munros: 1});
    let userObject = user.toObject();

    const incomplete = await Munro.find(({"_id" : {"$nin" : userObject.munros}}));

    return res.json(incomplete);
});

// Mark a munro as complete - Param: User ID
router.put('/mark-complete/:userId', async (req, res) => {
    const newMunro = await User.updateOne(
        {_id: req.params.userId}, 
        {$addToSet: {munros: req.body.munros[0]}}
    );

    const addedMunro = await Munro.findOne({_id: req.body.munros[0]});

    return res.json(addedMunro);
});

// Mark a munro as incomplete - Param: User ID
router.put('/mark-incomplete/:userId', async (req, res) => {
    const removeMunro = await User.updateOne(
        {_id: req.params.userId},
        {$pull: {munros: req.body.munros[0]}}
    );

    const incompleteMunro = await Munro.findOne({_id: req.body.munros[0]});

    return res.json(incompleteMunro);
});

// Return the total amount of munros completed
router.get('/count/:userId', async (req, res) => {
    const totalCompleted = await User.findOne({_id: req.params.userId});

    const total = {
        count: totalCompleted.munros.length
    }

    return res.json(total);
});
