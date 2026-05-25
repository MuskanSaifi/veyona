import mongoose from "mongoose";

/**
 * Feedback
 * Customer-submitted rating + comment for a completed ServiceVisit.
 * One feedback per visit is enforced via a unique index.
 */
const feedbackSchema = new mongoose.Schema(
  {
    serviceVisit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceVisit",
      required: true,
      unique: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "feedbacks" }
);

const MODEL_NAME = "Feedback";

if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default mongoose.model(MODEL_NAME, feedbackSchema);
