import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerImage: String,
    public_id: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, required: true },
    service: String,
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

testimonialSchema.index({ active: 1 });
testimonialSchema.index({ employee: 1 });
testimonialSchema.index({ createdAt: -1 });

export default mongoose.models.Testimonial ||
  mongoose.model("Testimonial", testimonialSchema);




