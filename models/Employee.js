import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: false,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    image: String,
    public_id: String,
    specialization: String,
    experience: Number, // in years
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

employeeSchema.index({ salon: 1, active: 1 });
employeeSchema.index({ salon: 1 });
employeeSchema.index({ active: 1 });

const MODEL_NAME = "Employee";

// Next.js hot-reloads modules but Mongoose keeps the first compiled schema.
// Delete cache so optional `salon` (and other schema edits) apply without a full server restart.
if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default mongoose.model(MODEL_NAME, employeeSchema);

