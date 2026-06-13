import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getMissingFields = (fields) => {
  return Object.entries(fields)
    .filter(([, value]) => !value || String(value).trim() === "")
    .map(([field]) => field);
};

export const validateChangePasswordBody = asyncHandler(
  async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const missingFields = getMissingFields({ currentPassword, newPassword });

    if (missingFields.length > 0) {
      throw new ApiError(400, `Missing fields: ${missingFields.join(", ")}`);
    }

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      throw new ApiError(400, "Password fields must be strings");
    }

    next();
  }
);
