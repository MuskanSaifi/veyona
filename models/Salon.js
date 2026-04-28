import mongoose from "mongoose";

const salonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    type: { type: String, enum: ["salon", "dentist", "tattoo"], required: true },
    image: String,
    public_id: String,
    openingTime: { type: String, required: true }, // e.g., "09:00"
    closingTime: { type: String, required: true }, // e.g., "18:00"
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

salonSchema.index({ type: 1, active: 1 });
salonSchema.index({ type: 1 });
salonSchema.index({ active: 1 });

export default mongoose.models.Salon ||
  mongoose.model("Salon", salonSchema);




