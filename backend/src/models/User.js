import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["donor", "recipient", "admin"], default: "donor" },
    location: { type: String, default: "" },
    organization: { type: String, default: "" },
    phone: { type: String, default: "" },
    bio: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    role: {
    type: String,
    enum: ["donor", "recipient", "admin"], //role
    default: "donor",
  },
  isVerified: { type: Boolean, default: false },  // new field
  resetPasswordToken: String,  // for password reset
  resetPasswordExpire: Date,
  emailVerifyToken: String,
  createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
