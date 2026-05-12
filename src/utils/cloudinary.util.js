import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFile(filePath) {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });
    return uploadResult;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    throw error;
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting local file:", err);
      } else {
        console.log("Local file deleted successfully");
      }
    });
  }
}
export { uploadFile };
