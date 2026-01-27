import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth/auth.js";

import userProfileRoutes from "./routes/profile/user-profile.js";
import goalsRoutes from "./routes/profile/goals.js";

import mountainsRoutes from "./routes/mountains/mountains.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// auth
app.use("/api/auth", authRoutes);

// profile
app.use("/api/profile/user-profile", userProfileRoutes);
app.use("/api/profile/goals", goalsRoutes);

// mountains
app.use("/api/mountains", mountainsRoutes);


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
