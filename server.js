import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth/auth.js";
import completedMountainsRoutes from "./routes/mountains/completed-mountains.js";
import cors from "cors";
import express from "express";
import goalsRoutes from "./routes/profile/goals.js";
import mongoose from "mongoose";
import mountainsRoutes from "./routes/mountains/mountains.js";
import userProfileRoutes from "./routes/profile/user-profile.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
	origin: ["http://localhost:4200"],
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
	credentials: false
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile/user-profile", userProfileRoutes);
app.use("/api/profile/goals", goalsRoutes);
app.use("/api/mountains/mountains", mountainsRoutes);
app.use("/api/mountains/completed-mountains", completedMountainsRoutes);

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
