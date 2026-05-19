import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const getMissingFields = (fields) => {
  return Object.entries(fields)
    .filter(([, value]) => !value || String(value).trim() === "")
    .map(([field]) => field);
};

const getValidationErrors = (error) => {
  return Object.values(error.errors).map((fieldError) => ({
    field: fieldError.path,
    message: fieldError.message,
  }));
};

async function registerUser(req, res) {
  try {
    const { username, email, fullName, avatar, password } = req.body;
    const missingFields = getMissingFields({
      username,
      email,
      fullName,
      password,
    });

    if (missingFields.length > 0) {
      throw new ApiError(400, `${missingFields.join(", ")} required`);
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      throw new ApiError(400, "Username or email already exists");
    }
    const newUser = new User({
      username,
      email,
      fullName,
      avatar: avatar?.trim() || undefined,
      password,
    });
    await newUser.save();

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: createdUser },
          "User registered successfully"
        )
      );
  } catch (error) {
    console.error("Error registering user:", error);
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
}

export { registerUser };
