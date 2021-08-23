const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  guestId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  startingDayOfStay: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 10,
  },
  endingDayOfStay: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 10,
  },
  roomDetails: {
    type: Object,
    required: true,
  },
  bookedOn: {
    type: String,
    required: true,
  },
  isStayCompleted: {
    type: Boolean,
    default: false,
  },
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  bookingMode: {
    type: String,
  },
  status: {
    type: String,
    default: "yettostay"
  },
});

const Booking = mongoose.model("booking", bookingSchema);

exports.Booking = Booking;
