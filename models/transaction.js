const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  guestId: {
    type: ObjectId,
    required: true,
  },
  roomId: {
    type: ObjectId,
    required: true,
  },
  bookingId: {
    type: ObjectId,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  isTransactionCompleted: {
    type: Boolean,
    default: false,
  },
  isCanceled: {
    type: Boolean,
    default: false,
  },
});

const Transaction = mongoose.model("transaction", transactionSchema);

exports.Transaction = Transaction;
