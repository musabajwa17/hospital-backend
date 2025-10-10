import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiREsponse.js";
const registerUser = asyncHandler(async (req, res) => {
  const { email, fullname, password, username } = req.body;

  // Validation
  if ([fullname, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User or email already exists");
  }
  // check for image and avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  // upload img and avatar to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  // create user object - create entry in database
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  // remove password and refresh token from response
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
// check for user creation
  if(!createdUser){
    throw new ApiError(500, "Something went wrong while adding user")
  }
// return the response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Succesfully")
  )
//   res.status(201).json({
//     success: true,
//     message: "User registered successfully",
//   });
});

export { registerUser };
