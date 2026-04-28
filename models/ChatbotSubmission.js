import mongoose from "mongoose";

const chatbotSubmissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    selectedQuestions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    message: { type: String },
    status: {
      type: String,
      enum: ["new", "contacted", "resolved"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ChatbotSubmission ||
  mongoose.model("ChatbotSubmission", chatbotSubmissionSchema);
