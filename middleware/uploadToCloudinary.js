import { cloudinary } from "../cloudinary.js";
import multer from "multer";

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function uploadBufferToCloudinary(buffer, options) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });

        stream.end(buffer);
    });
}

export async function uploadProfileImageToCloudinary(req, res, next) {
    try {
        if (!req.file) return next();

        const result = await uploadBufferToCloudinary(req.file.buffer, {
            folder: "munros/profile-images",
            resource_type: "image",
            transformation: [{ width: 600, height: 600, crop: "fill", gravity: "face" }],
        });

        req.uploadedImageUrl = result.secure_url;
        req.uploadedImagePublicId = result.public_id;
        
        next();
    } catch (err) {
        return res.status(400).json({ message: "Cloudinary upload failed", error: err.message });
    }
}
