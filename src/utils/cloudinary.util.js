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

async function deleteFile(publicId) {
  try {
    if (!publicId) {
      throw new Error("Public ID is required for deletion");
    }
    configureCloudinary();
    const deleteResult = await cloudinary.uploader.destroy(publicId);
    return deleteResult;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
}

function getCloudinaryPublicId(fileUrl) {
  try {
    if (!fileUrl) return null;

    const url = new URL(fileUrl);
    if (!url.hostname.includes("res.cloudinary.com")) return null;

    const pathSegments = url.pathname.split("/").filter(Boolean);
    const uploadIndex = pathSegments.indexOf("upload");
    if (uploadIndex === -1) return null;

    const publicIdSegments = pathSegments.slice(uploadIndex + 1);
    if (publicIdSegments[0]?.match(/^v\d+$/)) {
      publicIdSegments.shift();
    }

    if (publicIdSegments.length === 0) return null;

    return publicIdSegments.join("/").replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}

export { uploadFile, deleteFile, getCloudinaryPublicId };
