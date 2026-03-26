import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true, unique: true, trim: true },
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		password: { type: String, required: true, select: false },
		isVerified: { type: Boolean, default: false },
		confirmationToken: { type: String, default: null, select: false },
		confirmationTokenExpires: { type: Date, default: null, select: false },
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
