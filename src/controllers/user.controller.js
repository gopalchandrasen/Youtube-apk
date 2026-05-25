import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadFile } from "../utils/cloudinary.util.js"

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
    const { username, email, fullName, password } = req.body;
    const missingFields = getMissingFields({
      username,
      email,
      fullName,
      password,
    });

    if (missingFields.length > 0) {
      throw new ApiError(400, `${missingFields.join(", ")} required`);
    }

    // Pull uploaded files from multer
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      // User already exists — verify password and treat as login
      const isPasswordValid = await userExists.comparePassword(password);
      if (!isPasswordValid) {
        throw new ApiError(401, "User already exists. Invalid password.");
      }

      const accessToken = await userExists.generateAccessToken();
      const refreshToken = await userExists.generateRefreshToken();

      userExists.refreshToken = refreshToken;
      await userExists.save({ validateBeforeSave: false });

      const existingUser = await User.findById(userExists._id).select(
        "-password -refreshToken"
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { user: existingUser, accessToken, refreshToken },
            "User already exists. Logged in successfully."
          )
        );
    }

    // New user flow — upload images to Cloudinary if provided
    let avatarUrl;
    if (avatarLocalPath) {
      const avatarUpload = await uploadFile(avatarLocalPath);
      avatarUrl = avatarUpload?.secure_url;
    }

    let coverImageUrl;
    if (coverImageLocalPath) {
      const coverUpload = await uploadFile(coverImageLocalPath);
      coverImageUrl = coverUpload?.secure_url;
    }

    const newUser = new User({
      username,
      email,
      fullName,
      avatar: avatarUrl, // schema default URL kicks in if undefined
      coverImage: coverImageUrl,
      password,
    });
    await newUser.save();

    const accessToken = await newUser.generateAccessToken();
    const refreshToken = await newUser.generateRefreshToken();

    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { user: createdUser, accessToken, refreshToken },
          "User registered successfully"
        )
      );
  } catch (error) {
    console.error("Error registering user:", error);
    const statusCode = error?.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message: error?.message || "User registration failed",
    });
  }
}

export { registerUser };
