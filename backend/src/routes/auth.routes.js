import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ok, fail } from "../utils/response.js";
import crypto from "crypto";
import ResetToken from "../models/ResetToken.js"; // new model
import { sendEmail } from "../utils/mailer.js";



const router = Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password, role, location, organization, phone, bio } = req.body;

  if (!name || !email || !password) return fail(res, "Missing required fields");

   if (role === "admin") {
    return fail(res, "Admin accounts cannot be created via signup. Contact system administrator.", 403);
  }


  const exists = await User.findOne({ email });
  if (exists) return fail(res, "Email already registered");

  if (password.length < 6) return fail(res, "Password must be at least 6 characters");

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
    role: role || "donor",
    location: location || "",
    organization: role === "recipient" ? organization || "" : "",
    phone: phone || "",
    bio: bio || "",
    profilePicture:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

  return ok(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      location: user.location,
      organization: user.organization,
      phone: user.phone,
      bio: user.bio,
      profilePicture: user.profilePicture
    }
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) return fail(res, "Invalid credentials");

  const okPass = await bcrypt.compare(password, user.password);
  if (!okPass) return fail(res, "Invalid credentials");

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

  return ok(res, {
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      location: user.location,
      organization: user.organization,
      phone: user.phone,
      bio: user.bio,
      profilePicture: user.profilePicture
    }
  });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return fail(res, "Email is required");

    const user = await User.findOne({ email });
    if (!user) return fail(res, "No user with this email");

    // create token (hex)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // save token document (remove previous tokens for user)
    await ResetToken.deleteMany({ userId: user._id });
    await ResetToken.create({ userId: user._id, token, expiresAt });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // send email (or print to console if no creds)
    await sendEmail(
      user.email,
      "ReWearify — Password reset",
      `<p>You requested a password reset. Click the link to set a new password (valid 15 minutes):</p>
             <p><a href="${resetLink}">${resetLink}</a></p>`
    );

    return ok(res, { message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("forgot-password error:", err);
    return fail(res, "Server error");
  }
});

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) return fail(res, "Password must be at least 6 characters");

    const resetDoc = await ResetToken.findOne({ token });
    if (!resetDoc) return fail(res, "Invalid or expired token");

    if (resetDoc.expiresAt < Date.now()) {
      await ResetToken.deleteOne({ token });
      return fail(res, "Token expired");
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(resetDoc.userId, { password: hashed });

    // remove used token
    await ResetToken.deleteOne({ token });

    return ok(res, { message: "Password reset successful" });
  } catch (err) {
    console.error("reset-password error:", err);
    return fail(res, "Server error");
  }
});


export default router;
