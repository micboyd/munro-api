const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	firstname: {
		type: String,
		required: true,
	},
	lastname: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	profileImage: {
		type: String,
		default: '',
	},
	bio: {
		type: String,
		default: '',
	},
	completedMunros: [
		{
			munroId: {
				type: String,
				ref: 'Munro',
			},
			dateCompleted: {
				type: Date,
				default: Date.now,
			},
			notes: {
				type: String,
				default: '',
			},
			rating: {
				type: Number,
				default: 0,
			},
			summitImage: [
				{
					type: String,
					default: '',
				},
			],
		}
	],
});

module.exports = mongoose.model('User', userSchema);

