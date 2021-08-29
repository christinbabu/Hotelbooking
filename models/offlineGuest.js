const mongoose = require("mongoose");
const Yup = require("yup");
const jwt = require("jsonwebtoken");

const offlineGuestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    validate: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  },
  bookedHotelDetails: {
    type: Array,
    default: [],
  },
  previousBookedHotelDetails: {
    type: Array,
    default: [],
  },
  address: {
    type: String,
    default:null
  },
  phoneNumber: {
    type: String,
    minlength: 5,
    maxlength: 50,
  },
});

offlineGuestSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      name:this.name,
      isGuest: true,
    },
    process.env.JWT_AUTH_PRIVATE_KEY
  );
  return token;
};

offlineGuestSchema.methods.generateResetToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      isGuest: true,
    },
    process.env.JWT_CHANGEPASSWORD_PRIVATE_KEY
  );
  return token;
};

const OfflineGuest = mongoose.model("offlineguest", offlineGuestSchema);

function validateOfflineGuest(data) {
  const schema = Yup.object().shape({
    name: Yup.string().min(2).max(50).required("Name is required").label("Name"),
    email: Yup.string().required("Email is required").email("Email must be valid").label("Email"),
    phoneNumber: Yup.string().min(5).max(50)
      .nullable(),
  });
  return schema.validate(data);
}

exports.OfflineGuest = OfflineGuest;
exports.validateOfflineGuest = validateOfflineGuest;