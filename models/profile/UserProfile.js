import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        bio: { type: String },
        profileImage: { type: String },
    },
    { timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
