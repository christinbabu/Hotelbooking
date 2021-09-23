const express = require("express");
const router = express.Router();
const _ = require("lodash");
const mongoose = require("mongoose");
const guestMiddleware = require("../../middleware/guest");
const auth = require("../../middleware/auth");
const getDays = require("../../utils/getDays");
const {Hotel} = require("../../models/hotel");
const {Room} = require("../../models/room");
const {Booking} = require("../../models/booking");
const {Guest} = require("../../models/guest");
const {retrieveMainPhoto, retrieveOtherPhotos} = require("../../utils/retrieveImages");
const validateObjectId = require("../../middleware/validateObjectId");

router.get("/", async (req, res) => {
  console.log(req.headers.host,"rq")
  let hotel = await Hotel.find().where("hotelRooms").exists(true).ne([]).select({city:1});
  if (!hotel) return res.status(404).send("No hotels found found");
  
  res.send(hotel);
})

module.exports = router;
