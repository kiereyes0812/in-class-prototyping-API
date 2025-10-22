const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, trim: true, lowercase: true, unique: true },
    userName:  { type: String, required: true, trim: true, unique: true },
    password:  { type: String, required: true },
    isAdmin:   { type: Boolean, default: false },
    mobileNo:  { type: String, required: true, trim: true }
  },
  { timestamps: true }
);


userSchema.index({ userName: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
userSchema.index({ email: 1 }, { unique: true });


userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
