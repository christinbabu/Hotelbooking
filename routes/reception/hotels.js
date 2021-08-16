const formidable = require("formidable");
const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const receptionMiddleware = require("../../middleware/reception");
const validate = require("../../middleware/validate");
const validateObjectId = require("../../middleware/validateObjectId");
const {validateHotel, Hotel} = require("../../models/hotel");
const findReception = require("../../utils/findReception");
const createFolder = require("../../utils/createFolder");
const {retrieveMainPhoto, retrieveOtherPhotos} = require("../../utils/retrieveImages");
const saveImagesandGetPath = require("../../utils/saveImagesandGetPath");

router.get("/", [auth, receptionMiddleware], async (req, res) => {
  let {pageNumber, pageSize} = req.query;
  pageNumber = Number(pageNumber);
  pageSize = Number(pageSize);

  const {hotels} = await findReception(req.user.username);
  let hotel = await Hotel.find({
    _id: {
      $in: hotels,
    },
  }).select({_id: 1, hotelName: 1, mainPhoto: 1, city: 1, startingRatePerDay: 1})
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

router.get("/:id", [auth, receptionMiddleware, validateObjectId], async (req, res) => {
  console.log("abc");
  let hotel = [await Hotel.findById(req.params.id)];
  if (!hotel[0]) return res.status(404).send("hotel with given id not found");
  hotel = await retrieveMainPhoto(hotel);
  hotel = await retrieveOtherPhotos(hotel);
  res.send(hotel);
});

router.post("/", [auth, receptionMiddleware, validate(validateHotel)], async (req, res) => {
  createFolder(req.user.username);
  await saveImagesandGetPath(req);
  
  let {starRating}=req.body
  if(starRating) starRating=Number(starRating)
  else starRating=0
  
  req.body.starRating=starRating
  const hotel = new Hotel(req.body);
  await hotel.save();
  const reception = await findReception(req.user.username);
  reception.hotels.push(hotel._id);
  await reception.save();
  res.send(hotel);
});

router.put(
  "/:id",
  [auth, receptionMiddleware, validateObjectId, validate(validateHotel)],
  async (req, res) => {
    await saveImagesandGetPath(req);

    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!hotel) return res.status(404).send("hotel with given id not found");
    res.send(hotel);
  }
);

router.delete("/:id", [auth, receptionMiddleware, validateObjectId], async (req, res) => {
  const hotel = await Hotel.findByIdAndDelete(req.params.id);
  if (!hotel) return res.status(404).send("hotel with given id not found");
  res.send(hotel);
});

module.exports = router;
