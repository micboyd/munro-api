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

		// Read and parse JSON file
		const filePath = path.join(__dirname, 'filtered_munros.json');
		const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

		try {
			// Insert data into the collection
			await Munro.insertMany(jsonData);
			console.log('Data imported successfully!');
		} catch (err) {
			console.error('Error importing data:', err.message);
		} finally {
			mongoose.disconnect();
		}
	})
	.catch(err => {
		console.error('MongoDB connection error:', err);
	});
