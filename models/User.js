const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, trim: true, lowercase: true, unique: true },
    userName:  { type: String, required: true, trim: true, lowercase: true, unique: true },
    password:  { type: String, required: true },
    isAdmin:   { type: Boolean, default: false },
    mobileNo:  { type: String, required: true, trim: true }
  },
  { timestamps: true }
);


userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
