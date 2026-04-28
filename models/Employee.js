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
      required: true,
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

export default mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);

