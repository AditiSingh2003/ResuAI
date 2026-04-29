import mongoose from "mongoose";

const ResumeCacheSchema = new mongoose.Schema({
  userEmail:  { type: String, required: true },
  filename:   { type: String },
  score:      { type: Number },
  result:     { type: mongoose.Schema.Types.Mixed },
  createdAt:  { type: Date, default: Date.now },
});

export default mongoose.models.ResumeCache || mongoose.model("ResumeCache", ResumeCacheSchema);
