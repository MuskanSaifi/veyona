import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    image: String,
    public_id: String,
    type: { type: String, enum: ["salon", "dentist", "tattoo"], required: true },
    salons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Salon" }], // Direct locations for this category
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ type: 1, active: 1 });
categorySchema.index({ createdAt: -1 });

export default mongoose.models.Category ||
  mongoose.model("Category", categorySchema);

