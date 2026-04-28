import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);




