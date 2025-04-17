const mongoose = require('mongoose');

const MunroSchema = new mongoose.Schema({
	hill_id: { type: Number },
	hill_list: { type: String },
	hill_name: { type: String },
	meaning: { type: String },
	height: { type: Number },
	height_drop: { type: Number },
	latitude: { type: Number },
	longitude: { type: Number },
	os_ref: { type: Number },
	region_name: { type: String },
});

module.exports = mongoose.model('Munro', MunroSchema);

