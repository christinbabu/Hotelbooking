const express = require("express");
const router = express.Router();
const _ = require("lodash");
const mongoose = require("mongoose");
const renterMiddleware = require("../../middleware/renter");
const auth = require("../../middleware/auth");
const getDays = require("../../utils/getDays");
const {Hotel} = require("../../models/hotel");
const {Room} = require("../../models/room");
const {Booking} = require("../../models/booking");
const {Guest} = require("../../models/guest");
const {retrieveMainPhotobyPath, retrieveMainPhoto} = require("../../utils/retrieveImages");
const validateObjectId = require("../../middleware/validateObjectId");

router.get("/", [auth, renterMiddleware], async (req, res) => {
  let finalData = [];
  let bookings;
  console.log(req.query);

  if (req.query.isStayCompleted === "true") {
    bookings = await Booking.find({guestId: req.user._id, isStayCompleted: true}).lean();
  } else {
    bookings = await Booking.find({guestId: req.user._id, isStayCompleted: false}).lean();
  }

  _.each(bookings, async (booking, index) => {
    const hotel = await Hotel.findById(booking.hotelId);
    bookings[index].mainPhoto = await retrieveMainPhotobyPath(hotel.mainPhoto);
    bookings[index].address = hotel.address;
    bookings[index].rating = hotel.reviewScore;
    bookings[index].hotelName = hotel.hotelName;

    totalPrice = 0;
    totalBeds = 0;
    totalGuests = 0;
    totalRooms = 0;
    for (let [key, value] of Object.entries(booking.roomDetails)) {
      let objectValues = [];
      for (const [key1, value1] of Object.entries(value)) {
        objectValues.push(value1);
      }
      totalPrice += objectValues[0] * objectValues[1];
      totalBeds += objectValues[0] * objectValues[2];
      totalGuests += objectValues[0] * objectValues[3];
      totalRooms += objectValues[0];
    }
    bookings[index].totalPrice = totalPrice;
    bookings[index].totalBeds = totalBeds;
    bookings[index].totalGuests = totalGuests;
    bookings[index].totalRooms = totalRooms;

    bookings[index].startingDayOfStay = new Date(bookings[index].startingDayOfStay).toLocaleString(
      "en-us",
      {day: "numeric", month: "long", year: "numeric"}
    );
    bookings[index].endingDayOfStay = new Date(bookings[index].endingDayOfStay).toLocaleString(
      "en-us",
      {day: "numeric", month: "long", year: "numeric"}
    );
    finalData.push(bookings[index]);
    if (index == bookings.length - 1) {
      sendData();
    }
  });

  function sendData() {
    console.log("sending");
    res.send(finalData);
  }
});

router.get("/guest", [auth, guestMiddleware], async (req, res) => {
  const {roomIds} = req.query;
  let finalRoomsData = [];
  let rooms = [await Room.find().where("_id").in(roomIds).lean()];

  for (let room of rooms) {
    finalRoomsData.push(await retrieveMainPhoto(room));
  }

  return res.send(_.flattenDeep(finalRoomsData));
});

module.exports = router;