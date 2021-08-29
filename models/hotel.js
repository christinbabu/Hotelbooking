const Yup = require("yup");
const mongoose = require("mongoose");

const hotelSchema = new mongoose.Schema({
  hotelName: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  starRating: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5],
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function (v) {
        return v && !Object.is(Number(v), NaN) && v.length === 12;
      },
      message: "This is not a valid mobile number",
    },
    required: true,
  },
  address: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 255,
  },
  city: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
  },
  postalCode: {
    type: String,
    validate: {
      validator: function (v) {
        return v && !Object.is(Number(v), NaN) && v.length === 6;
      },
      message: "This is not a valid postal code",
    },
    required: true,
  },
  parking: {
    type: String,
    required: true,
    enum: ["No", "Yes, Free", "Yes, Paid"],
  },
  breakfast: {
    type: String,
    required: true,
    enum: ["No", "Yes, Free", "Yes, Paid"],
  },
  facilities: {
    type: Array,
    default: [],
  },
  extraBed: {
    type: Boolean,
    required: true,
  },
  noOfExtraBeds: {
    type: Number,
    min: 1,
    max: 4,
    default: null,
  },
  pricePerExtraBed: {
    type: Number,
    min: 5,
    max: 10000,
    default: null,
  },
  startingRatePerDay: {
    type: Number,
    required: true,
    min: 0,
    max: 2500000,
    default: 0,
  },
  mainPhoto: {
    type: String,
    required: true,
  },
  photos: {
    type: Array,
  },
  freeCancellationAvailable: {
    type: String,
    required: true,
  },
  ifNotCancelledBeforeDate: {
    type: String,
    required: true,
    enum: [],
  },
  checkInStart: {
    type: String,
    required: true,
  },
  checkInEnd: {
    type: String,
    required: true,
  },
  checkOutStart: {
    type: String,
    required: true,
  },
  checkOutEnd: {
    type: String,
    required: true,
  },
  accomodateChildren: {
    type: Boolean,
    required: true,
  },
  allowPets: {
    type: Boolean,
    required: true,
  },
  reviewScore: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  incomeInMonth: {
    type: Object,
    default: null,
  },
  reviewIds: {
    type: Array,
    default: [],
  },
  hotelRooms: {
    type: Array,
    default: [],
  },
  provideDormitoryForDriver: {
    type: Boolean,
    required: true,
  },
  receptionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
});

const Hotel = mongoose.model("hotel", hotelSchema);

function validateHotel(data) {
  const schema = Yup.object().shape({
    hotelName: Yup.string().min(1).max(50).required(),
    starRating: Yup.string().oneOf(["", "1", "2", "3", "4", "5"]).nullable(),
    phoneNumber: Yup.string()
      .required()
      .length(12)
      .matches(/^[0-9]+$/, "Mobile number must include only numbers"),
    address: Yup.string().required().min(8).max(255),
    city: Yup.string().required().min(1).max(50),
    postalCode: Yup.string()
      .required()
      .length(6)
      .matches(/^[0-9]+$/, "Postal code must include only numbers"),
    parking: Yup.string().required().oneOf(["No", "Yes, Free", "Yes, Paid"]),
    breakfast: Yup.string().required().oneOf(["No", "Yes, Free", "Yes, Paid"]),
    facilities: Yup.array(),
    extraBed: Yup.boolean().required(),
    noOfExtraBeds: Yup.number().min(1).max(4),
    pricePerExtraBed: Yup.number().min(5).max(10000),
    mainPhoto: Yup.mixed().required(),
    photos: Yup.array().nullable(),
    freeCancellationAvailable: Yup.string().required(),
    ifNotCancelledBeforeDate: Yup.string(),
    checkInStart: Yup.string().required(),
    checkInEnd: Yup.string().required(),
    checkOutStart: Yup.string().required(),
    checkOutEnd: Yup.string().required(),
    accomodateChildren: Yup.boolean().required(),
    allowPets: Yup.boolean().required(),
    provideDormitoryForDriver: Yup.boolean().required(),
  });
  return schema.validate(data);
}

exports.Hotel = Hotel;
exports.validateHotel = validateHotel;

//? API post request data
//{
//   "hotelName":"abc",
//   "starRating":"5",
//   "contactName":"dvd",
//   "phoneNumber":"914253080".
//   "address":"rgergerge ergeger egrer",
//   "city":"dv",
//   "placeForSearch":"hampi"
//   "postalCode":"458698",
//   "parking":"No",
//   "breakfast":"No",
//   "facilities":["bed"],
//   "extraBed":true,
//   "extraBedDetails":["ac"],
//   "mainPhoto":"http://bed",
//   "photos":["dsd","few"],
//   "freeCancellationAvailable":false,
//   "ifNotCancelledBeforeDate":"scsc",
//   "checkIn":"12:30",
//   "checkOut":"15:4d",
//   "accomodateChildren":true,
//   "allowPets":false,
//   "isPrepaymentRequired":true,
//   "provideDormitoryForDriver":true,
//   "GST":"false",
//   "tradeName":"cece",
//   "GSTIN":"wefwe",
//   "panCardNumber":"wfwef",
//   "state":"karnataka"
// }
