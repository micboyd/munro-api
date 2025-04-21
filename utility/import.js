const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Munro = require('../models/Munro');

require('dotenv').config();

mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(async () => {
		console.log('Connected to MongoDB');

		const filePath = path.join(__dirname, 'filtered_munros.json');
		const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

		// Add imageUrl property to each object
		const updatedData = jsonData.map(munro => {
			return {
				...munro,
				image_url: `https://i.imghippo.com/files/tn9640iuI.jpg`, // customize as needed
			};
		});

		try {
			await Munro.insertMany(updatedData);
			console.log('Data imported successfully with image URLs!');
		} catch (err) {
			console.error('Error importing data:', err.message);
		} finally {
			mongoose.disconnect();
		}
	})
	.catch(err => {
		console.error('MongoDB connection error:', err);
	});