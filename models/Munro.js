const mongoose = require('mongoose');

const MunroSchema = new mongoose.Schema({
	name: { type: String },
	longitude: { type: Number },
	latitude: { type: Number },
	height: { type: Number },
	hillbagging: { type: String },
});

module.exports = mongoose.model('Munro', MunroSchema);
