import mongoose from "mongoose";

/**
 * WalletTransaction
 *
 * A single credit or debit entry against an employee's wallet.
 *
 * Balance is computed on the fly (no stored "balance" field on Employee)
 * via an aggregation: credits − debits, restricted to `status: "completed"`.
 *
 * Categories are open-ended strings so admins can label entries however they
 * like, but a few sensible defaults are validated to prevent typos.
 */
const WALLET_CATEGORIES = [
  "service_commission",
  "bonus",
  "incentive",
  "tip",
  "penalty",
  "withdrawal",
  "adjustment",
  "refund",
  "employee_deposit",
  "product_purchase",
  "other",
];

const walletTransactionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      enum: WALLET_CATEGORIES,
      default: "adjustment",
    },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
      index: true,
    },

    // Optional link back to the thing that generated this transaction
    // (e.g. an Appointment id or a ServiceVisit id), so the entry can be traced.
    referenceType: { type: String, trim: true, default: "" },
    referenceId: { type: mongoose.Schema.Types.ObjectId },

    razorpayOrderId: { type: String, trim: true, index: true },
    razorpayPaymentId: { type: String, trim: true },

    // Admin who created this entry
    createdByRole: {
      type: String,
      enum: ["admin", "system", "employee"],
      default: "admin",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true, collection: "wallet_transactions" }
);

walletTransactionSchema.index({ employee: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1, createdAt: -1 });

walletTransactionSchema.statics.WALLET_CATEGORIES = WALLET_CATEGORIES;

/**
 * Compute an employee's current wallet balance.
 * Returns { balance, totalCredit, totalDebit, count }.
 */
walletTransactionSchema.statics.getBalance = async function (employeeId) {
  const result = await this.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(String(employeeId)),
        status: "completed",
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalCredit = 0;
  let totalDebit = 0;
  let count = 0;
  for (const row of result) {
    if (row._id === "credit") totalCredit = row.total;
    if (row._id === "debit") totalDebit = row.total;
    count += row.count;
  }

  return {
    balance: Math.max(0, totalCredit - totalDebit),
    totalCredit,
    totalDebit,
    count,
  };
};

const MODEL_NAME = "WalletTransaction";

if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export default mongoose.model(MODEL_NAME, walletTransactionSchema);
export { WALLET_CATEGORIES };
