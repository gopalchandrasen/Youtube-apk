import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadFile } from "../utils/cloudinary.util.js";
import jwt from "jsonwebtoken";

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
async function loginUser(req, res) {
  // Implementation for user login (not provided in the original code snippet)
  //get email and password from request body
  //validate that email and password are provided
  //find user by email
  //if user not found, return error
  //compare provided password with stored hashed password
  //if password is invalid, return error
  //generate access token and refresh token
  //store refresh token in database
  //return user data and tokens in response

  const { username, password } = req.body;
  const missingFields = getMissingFields({ username, password });
  if (missingFields.length > 0) {
    throw new ApiError(400, `${missingFields.join(", ")} required`);
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully."
      )
    );
}

async function profileUser(req, res) {
  // Implementation for fetching user profile (not provided in the original code snippet)
  //get user id from request params
  //find user by id
  //if user not found, return error
  //return user data in response
  const userId = req.user._id;
  const user = await User.findById(userId).select("-password -refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User profile fetched successfully."));
}

async function logoutUser(req, res) {
  //find and update user by id, set refresh token to null
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  //clear cookies
  return res
    .status(200)
    .cookie("refreshToken", "", { ...options, expires: new Date(0) })
    .cookie("accessToken", "", { ...options, expires: new Date(0) })
    .json(new ApiResponse(200, null, "User logged out successfully."));
}

async function refreshAccessToken(req, res) {
  //get refresh token from cookies
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token required");
  }
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const userId = decodedToken?._id || decodedToken?.id;
  const user = await User.findById(userId);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const newAccessToken = await user.generateAccessToken();
  const newRefreshToken = await user.generateRefreshToken();

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", newRefreshToken, options)
    .cookie("accessToken", newAccessToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken, refreshToken: newRefreshToken },
        "Access token refreshed successfully."
      )
    );
}

export { registerUser, loginUser, logoutUser, profileUser, refreshAccessToken };
