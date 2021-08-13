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
    enum: [0,1,2,3,4,5],
  },
  contactName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
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
  placeForSearch: {
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
    default:[]
  },
  extraBed: {
    type: Boolean,
    required: true,
  },
  noOfExtraBeds: {
    type: Number,
    min:1,
    max:4,
    default:null
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
  checkIn: {
    type: String,
    required: true,
  },
  checkOut: {
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
  isPrepaymentRequired: {
    type: Boolean,
    required: true,
  },
  provideDormitoryForDriver: {
    type: Boolean,
    required:true
  },
  GST: {
    type: Boolean,
    required: true,
  },
  tradeName: {
    type: String,
  },
  GSTIN: {
    type: String,
  },
  panCardNumber: {
    type: String,
    required:true
  },
  state: {
    type: String,
    required:true
  },
  paymentAddress:{
    type:String,
    required:true,
    min:8,
    max:255
  }
});

const Hotel = mongoose.model("hotel", hotelSchema);

function validateHotel(data) {
  const schema = Yup.object().shape({
    hotelName: Yup.string().min(1).max(50).required(),
    starRating: Yup.string().oneOf(["","1", "2", "3", "4", "5"]).nullable(),
    contactName: Yup.string().required().min(2).max(50),
    phoneNumber: Yup.string()
      .required()
      .length(12)
      .matches(/^[0-9]+$/, "Mobile number must include only numbers"),
    address: Yup.string().required().min(8).max(255),
    city: Yup.string().required().min(1).max(50),
    placeForSearch: Yup.string().required().min(1).max(50),
    postalCode: Yup.string()
      .required()
      .length(6)
      .matches(/^[0-9]+$/, "Postal code must include only numbers"),
    parking: Yup.string().required().oneOf(["No", "Yes, Free", "Yes, Paid"]),
    breakfast: Yup.string().required().oneOf(["No", "Yes, Free", "Yes, Paid"]),
    facilities: Yup.array(),
    extraBed: Yup.boolean().required(),
    noOfExtraBeds: Yup.number().min(1).max(4),
    mainPhoto: Yup.mixed().required(),
    photos: Yup.array().nullable(),
    freeCancellationAvailable: Yup.string().required(),
    ifNotCancelledBeforeDate: Yup.string(),
    checkIn: Yup.string().required(),
    checkOut: Yup.string().required(),
    accomodateChildren: Yup.boolean().required(),
    allowPets: Yup.boolean().required(),
    provideDormitoryForDriver: Yup.boolean().required(),
    isPrepaymentRequired: Yup.boolean().required(),
    GST: Yup.boolean().required(),
    tradeName: Yup.string().when("GST", {
      is: true,
      then: Yup.string().required("Trade name is required"),
    }),
    GSTIN: Yup.string().when("GST", {
      is: true,
      then: Yup.string().required("GSTIN is required"),
    }),
    panCardNumber: Yup.string().required(),
    state: Yup.string().required(),
    paymentAddress:Yup.string().required().min(8).max(255),
  }) 
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
