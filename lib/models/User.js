import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true },
  name:           { type: String },
  image:          { type: String },
  plan:           { type: String, default: "free" },
  analysesUsed:   { type: Number, default: 0 },
  analysesLimit:  { type: Number, default: 3 },
  resetDate:      { type: Date, default: () => new Date(Date.now() + 30*24*60*60*1000) },
  createdAt:      { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
