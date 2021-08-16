const formidable = require("formidable");
const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const auth = require("../../middleware/auth");
const adminMiddleware = require("../../middleware/admin");
const validate = require("../../middleware/validate");
const validateObjectId = require("../../middleware/validateObjectId");
const {validateHotel, Hotel} = require("../../models/hotel");
const {validateReception, Reception} = require("../../models/reception");
const findAdmin= require("../../utils/findAdmin");
const createFolder = require("../../utils/createFolder");
const {retrieveMainPhoto, retrieveOtherPhotos} = require("../../utils/retrieveImages");
const saveImagesandGetPath = require("../../utils/saveImagesandGetPath");

router.get("/", [auth, adminMiddleware], async (req, res) => {
  let {pageNumber, pageSize} = req.query;
  pageNumber = Number(pageNumber);
  pageSize = Number(pageSize);

  console.log("back",req.user.username)
  const {hotels} = await findAdmin(req.user.username);
  console.log(hotels,"gg")
  let hotel = await Hotel.find({
    _id: {
      $in: hotels,
    },
  }).select({_id: 1, hotelName: 1, mainPhoto: 1, city: 1, startingRatePerDay: 1,receptionId:1})
    .skip(pageNumber * pageSize)
    .limit(pageSize);

  hotel = await retrieveMainPhoto(hotel);

  let hotelsCount = await Hotel.find({
    _id: {
      $in: hotels,
    },
  }).countDocuments();

  let hotelsData = {hotels:hotel, hotelsCount};

  res.send(hotelsData);
});

router.get("/:id", [auth, adminMiddleware, validateObjectId], async (req, res) => {
  console.log("abc");
  let hotel = [await Hotel.findById(req.params.id)];
  if (!hotel[0]) return res.status(404).send("hotel with given id not found");
  hotel = await retrieveMainPhoto(hotel);
  hotel = await retrieveOtherPhotos(hotel);
  res.send(hotel);
});

router.post("/", [auth, adminMiddleware, validate(validateHotel)], async (req, res) => {
  console.log("start")
  createFolder(req.user.email);
  await saveImagesandGetPath(req);
  
  let {starRating}=req.body
  if(starRating) starRating=Number(starRating)
  else starRating=0
  
  req.body.starRating=starRating
  const hotel = new Hotel(req.body);
  await hotel.save();
  
  const admin = await findAdmin(req.user.username);
  admin.hotels.push(hotel._id);
  await admin.save();
  
  
  console.log("end")
  // let email = await Reception.findOne({email: req.body.email.toLowerCase()});
  // if (email) return res.status(400).send({property: "email", msg: "Email Already Registered"});

  // let username = await Reception.findOne({username: req.body.username.toLowerCase()});
  // if (username) return res.status(400).send({property: "username", msg: "Username Already Taken"});

  // if (req.body.password !== req.body.confirmPassword)
  //   return res.status(400).send({property: "confirmPassword", msg: "Passwords doesn't Match'"});

  // const salt = await bcrypt.genSalt(10);
  // const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // req.body.password = hashedPassword;
  // req.body.email = req.body.email.toLowerCase();
  // req.body.username = req.body.username.toLowerCase();

  // let receptionData = _.pick(req.body, ["name", "email", "username", "password"]);

  // const reception = new Reception(receptionData);
  // await reception.save();
  // const token = reception.generateAuthToken();

  // res.send(token);

  res.send(hotel);
});

router.put(
  "/:id",
  [auth, adminMiddleware, validateObjectId, validate(validateHotel)],
  async (req, res) => {
    await saveImagesandGetPath(req);

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!hotel) return res.status(404).send("hotel with given id not found");
    res.send(hotel);
  }
);

router.delete("/:id", [auth, adminMiddleware, validateObjectId], async (req, res) => {
  const hotel = await Hotel.findByIdAndDelete(req.params.id);
  if (!hotel) return res.status(404).send("hotel with given id not found");
  res.send(hotel);
});

module.exports = router;
