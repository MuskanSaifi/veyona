import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number }, // Discounted/selling price (optional for parent services)
    originalPrice: { type: Number }, // Original price before discount (optional, shown struck when set)
    duration: { type: Number }, // Optional for parent services, in minutes
    image: String,
    public_id: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    parentService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
    },
    clinicAddress: { type: String }, // Snapshot of clinic address (for dental services)
    order: { type: Number, default: 0 }, // For sorting services
    active: { type: Boolean, default: true },
    isVideoConsultation: { type: Boolean, default: false }, // If true, user selects date/time only, no location
  },
  { timestamps: true, strictPopulate: false }
);

serviceSchema.index({ category: 1, active: 1 });
serviceSchema.index({ category: 1, active: 1, parentService: 1 });
serviceSchema.index({ parentService: 1 });
serviceSchema.index({ order: 1, createdAt: -1 });

export default mongoose.models.Service ||
  mongoose.model("Service", serviceSchema);




