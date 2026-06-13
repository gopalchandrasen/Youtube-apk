import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

const isBothSamePassword = (currentPassword, newPassword) => {
  if (currentPassword === newPassword) {
    throw new ApiError(
      400,
      "New password must be different from current password"
    );
  }
};

export const changeUserPassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  isBothSamePassword(currentPassword, newPassword);

  user.password = newPassword;
  await user.save();
};
