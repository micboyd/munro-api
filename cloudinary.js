import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import CloudinaryStorage from "multer-storage-cloudinary";

dotenv.config();

const required = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "munros",
        allowed_formats: ["jpg", "jpeg", "png"],
        transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    },
});