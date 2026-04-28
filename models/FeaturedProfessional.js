import mongoose from "mongoose";

const featuredProfessionalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: String,
    public_id: String,
    title: { type: String, required: true },
    description: { type: String, required: true },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

featuredProfessionalSchema.index({ active: 1 });
featuredProfessionalSchema.index({ order: 1, createdAt: -1 });

export default mongoose.models.FeaturedProfessional ||
  mongoose.model("FeaturedProfessional", featuredProfessionalSchema);




