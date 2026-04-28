import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: { type: String },
    phone: { type: String, required: true, unique: true },
    avatar: { type: String }, // Cloudinary secure_url
    avatarPublicId: { type: String }, // Cloudinary public_id for cleanup
    address: String,
    savedAddresses: [
      { label: { type: String, default: "Home" }, address: { type: String, required: true } },
    ],
    defaultAddressIndex: { type: Number, default: 0 },
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true });

const MODEL_NAME = "User";

// Next.js hot-reloads modules but Mongoose doesn't refresh compiled models.
// Without this, new fields (e.g. avatar) may be dropped by strict schema until restart.
if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default mongoose.model(MODEL_NAME, userSchema);

