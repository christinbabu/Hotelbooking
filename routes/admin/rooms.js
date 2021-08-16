const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const router = express.Router();
const auth = require("../../middleware/auth");
const adminMiddleware = require("../../middleware/admin");
const validate = require("../../middleware/validate");
const validateObjectId = require("../../middleware/validateObjectId");
const saveImagesandGetPath = require("../../utils/saveImagesandGetPath");
const createFolder = require("../../utils/createFolder");
const {validateRoom, Room} = require("../../models/room");
const {retrieveMainPhoto, retrieveOtherPhotos} = require("../../utils/retrieveImages");
const {Hotel} = require("../../models/hotel");

router.get("/", [auth, adminMiddleware], async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.query.hotelId))
    return res.status(404).send("Invalid Id");

  const {hotelRooms} = await Hotel.findById(req.query.hotelId);
  let rooms = [
    await Room.find({
      _id: {
        $in: hotelRooms,
      },
    }).select({
      _id: 1,
      roomType: 1,
      basePricePerNight: 1,
      numberOfGuestsInaRoom: 1,
      mainPhoto: 1,
      numberOfBeds: 1,
      kindOfBed: 1,
    }),
  ];


  let finalRoomsData = [];
  for (let room of rooms) {
    finalRoomsData.push(await retrieveMainPhoto(room));
  }

  res.send(_.flattenDeep(finalRoomsData));
});

router.get("/:id", [auth, adminMiddleware, validateObjectId], async (req, res) => {
  let room = [await Room.findById(req.params.id)];
  if (!room[0]) return res.status(404).send("room with given id not found");
  room = await retrieveMainPhoto(room);
  room = await retrieveOtherPhotos(room);
  res.send(room);
});

router.post("/", [auth, adminMiddleware, validate(validateRoom)], async (req, res) => {
  let hotelId=req.body.hotelId
  if (!mongoose.Types.ObjectId.isValid(hotelId))
    return res.status(400).send({property: "toast", msg: "Invalid hotelId"});
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) return res.status(404).send("hotel with id not found");

  createFolder(req.user.username);
  await saveImagesandGetPath(req);

  const room = new Room(req.body);
  await room.save();

  const rooms = await Room.find({
    _id: {
      $in: hotel.hotelRooms,
    },
  }).select({hotelId: 1, _id: 0, basePricePerNight: 1});

  const startingRatePerDay = _.min(_.flattenDeep(_.map(rooms, "basePricePerNight")));
  let startingPrices=[]
  startingPrices.push(startingRatePerDay)
  startingPrices.push(req.body.basePricePerNight)
  
  await Hotel.findByIdAndUpdate(hotelId, {$push: {hotelRooms: room._id}, startingRatePerDay: _.min(startingPrices)});
  res.send(room);
});

router.put("/:id", [auth, adminMiddleware, validateObjectId, validate(validateRoom)], async (req, res) => {
  const {hotelId} = req.body;
  console.log("before")
  await saveImagesandGetPath(req,method="put");
  console.log("after")
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, {new: true});
  if (!room) return res.status(404).send("room with given Id not found");

  const hotel = await Hotel.findById(hotelId);

  const rooms = await Room.find({
    _id: {
      $in: hotel.hotelRooms,
    },
  }).select({hotelId: 1, _id: 0, basePricePerNight: 1});

  const startingRatePerDay = _.min(_.flattenDeep(_.map(rooms, "basePricePerNight")));
  console.log(startingRatePerDay,"srpd")
  let startingPrices=[]
  startingPrices.push(startingRatePerDay)
  startingPrices.push(hotel.startingRatePerDay)
  console.log(startingPrices,"sp")
  // if (
  //   !(hotel.startingRatePerDay < startingRatePerDay) ||
  //   !(hotel.startingRatePerDay > startingRatePerDay)
  // )
  console.log(_.min(startingPrices),"mn")
    await Hotel.findByIdAndUpdate(hotelId, {startingRatePerDay:_.min(startingPrices)});
  res.send(room);
});

router.patch("/:id", [auth, adminMiddleware, validateObjectId], async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id);
  if (!room) return res.status(404).send("Room with given Id not found");
  res.send(room);
});

module.exports = router;



// const convertBase64toImage = require("./convertBase64toImage");

// module.exports = async function (req,method) {
//   // console.log("a",typeof(req.body.mainPhoto));

//   if(method==="put"&&req.body.isMainPhotoChanged){
//     req.body.mainPhoto = await convertBase64toImage(req.user.username, req.body.mainPhoto);
//   }
  
//   if(!method){
//     req.body.mainPhoto = await convertBase64toImage(req.user.username, req.body.mainPhoto);
//   }

//   console.log("b");

//   let photos = [];
//   console.log(req.body.photos,"ll");
//   if (req.body.photos?.length > 0)
//     for (let image of req.body.photos)
//       photos.push(await convertBase64toImage(req.user.username, image));
//   req.body.photos = photos;
// };