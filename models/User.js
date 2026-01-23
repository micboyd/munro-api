import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		firstname: { type: String, required: true, trim: true },
		lastname: { type: String, required: true, trim: true },

		username: { type: String, required: true, unique: true, trim: true },

		password: { type: String, required: true, select: false },

		profileImage: { type: String, default: "" },
		bio: { type: String, default: "" },

		completedMunros: [
			{
				munroId: { type: String, ref: "Munro" },
				dateCompleted: { type: Date, default: Date.now },
				notes: { type: String, default: "" },
				rating: { type: Number, default: 0 },
				summitImages: { type: [String], default: [] },
			},
		],
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
