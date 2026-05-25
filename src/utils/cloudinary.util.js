import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure lazily on first call so env vars are guaranteed to be loaded
let isConfigured = false;
function configureCloudinary() {
  if (isConfigured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isConfigured = true;
}

function safeUnlink(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting local file:", filePath, err.message);
    }
  });
}

async function uploadFile(filePath) {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }
    configureCloudinary();
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    // Clean up the local temp file after a successful upload
    safeUnlink(filePath);
    return uploadResult;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    // Try to clean up the local temp file even if upload failed
    safeUnlink(filePath);
    throw error;
  }
}

export { uploadFile };
