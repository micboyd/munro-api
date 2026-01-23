import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import munroRoutes from "./routes/munros.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // replaces bodyParser.json()

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/munros", munroRoutes);
app.use("/api/user", userRoutes);

try {
	await mongoose.connect(process.env.MONGO_URI);
	console.log("MongoDB connected");

	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
} catch (err) {
	console.error("MongoDB connection error:", err);
	process.exit(1);
}
