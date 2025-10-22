const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { errorHandler, createAccessToken } = require("../auth");

/** Check if email exists (200 w/ boolean) */
module.exports.checkEmailExists = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email.includes("@")) return res.status(400).json({ message: "Invalid email format" });

    const existing = await User.findOne({ email }).select("_id").lean();
    return res.status(200).json({ email, available: !existing });
  } catch (err) {
    return errorHandler(err, req, res);
  }
};

/** Check if username exists (200 w/ boolean; case-insensitive) */
module.exports.checkUsernameExists = async (req, res) => {
  try {
    const candidate = String(req.body.userName || "").trim();
    if (!candidate) return res.status(400).json({ message: "userName is required" });

    const existing = await User.findOne({ userName: candidate })
      .collation({ locale: "en", strength: 2 })
      .select("_id")
      .lean();

    return res.status(200).json({ userName: candidate, available: !existing });
  } catch (err) {
    return errorHandler(err, req, res);
  }
};

/** Register user */
module.exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, userName, mobileNo, password } = req.body || {};
    if (![firstName, lastName, email, userName, mobileNo, password].every(Boolean)) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!String(email).includes("@")) return res.status(400).json({ message: "Invalid email format" });
    if (String(password).length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

    const normEmail = String(email).trim().toLowerCase();
    const normUser  = String(userName).trim();

    // quick uniqueness checks (DB unique index is the real guard)
    const [emailHit, userHit] = await Promise.all([
      User.findOne({ email: normEmail }).select("_id").lean(),
      User.findOne({ userName: normUser }).collation({ locale: "en", strength: 2 }).select("_id").lean()
    ]);
    if (emailHit) return res.status(409).json({ message: "Email already in use" });
    if (userHit)  return res.status(409).json({ message: "Username already in use" });

    const hashed = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName:  String(lastName).trim(),
      email:     normEmail,
      userName:  normUser,
      mobileNo:  String(mobileNo).trim(),
      password:  hashed
    });

    return res.status(201).json({ message: "User registered successfully", user: user.toJSON() });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Email or username already in use" });
    return errorHandler(err, req, res);
  }
};

/** Login */
module.exports.loginUser = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || req.body.email || "").trim();
    const password   = String(req.body.password || "");

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    // Decide if identifier is an email
    const isEmail = identifier.includes("@");

    let user;
    if (isEmail) {
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else {
      // Case-insensitive exact username match
      user = await User.findOne({ userName: identifier })
        .collation({ locale: "en", strength: 2 });
    }

    if (!user) return res.status(401).json({ message: "Incorrect credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Incorrect credentials" });

    return res.status(200).json({
      message: "User logged in successfully",
      access: createAccessToken(user),
    });
  } catch (err) {
    return errorHandler(err, req, res);
  }
};


/** Get my profile (requires verify middleware) */
module.exports.getProfile = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("-password -__v").lean();
    if (!me) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(me);
  } catch (err) {
    return errorHandler(err, req, res);
  }
};

/** Reset my password (requires verify middleware) */
module.exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }
    const hashed = await bcrypt.hash(String(newPassword), 10);
    await User.findByIdAndUpdate(req.user.id, { $set: { password: hashed } });
    return res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    return errorHandler(err, req, res);
  }
};

/** Update my profile (requires verify middleware) */
module.exports.updateProfile = async (req, res) => {
  try {
    const update = {};
    ["firstName", "lastName", "mobileNo"].forEach(k => {
      if (typeof req.body?.[k] === "string") update[k] = req.body[k].trim();
    });
    if (!Object.keys(update).length) return res.status(400).json({ message: "No fields provided to update" });

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true, runValidators: true })
      .select("-password -__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    return errorHandler(err, req, res);
  }
};

/** Admin: update arbitrary user */
module.exports.updateUserByAdmin = async (req, res) => {
  try {
    const { userId, firstName, lastName, mobileNo, email, isAdmin } = req.body || {};
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const update = {};
    if (typeof firstName === "string") update.firstName = firstName.trim();
    if (typeof lastName  === "string") update.lastName  = lastName.trim();
    if (typeof mobileNo  === "string") update.mobileNo  = mobileNo.trim();
    if (typeof email     === "string") update.email     = email.trim().toLowerCase();
    if (typeof isAdmin   === "boolean") update.isAdmin  = isAdmin;

    if (!Object.keys(update).length) return res.status(400).json({ message: "No valid fields to update" });

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true })
      .select("-password -__v");
    if (!user) return res.status(404).json({ message: "Target user not found" });

    return res.status(200).json({ message: "User updated successfully", user });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Email already in use" });
    return errorHandler(err, req, res);
  }
};
