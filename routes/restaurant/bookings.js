const express = require("express");
const router = express.Router();
const _ = require("lodash");
const mongoose = require("mongoose");
const restaurantMiddleware = require("../../middleware/restaurant");
const auth = require("../../middleware/auth");
const getDays = require("../../utils/getDays");
const {Hotel} = require("../../models/hotel");
const {Room} = require("../../models/room");
const {Booking, validateBooking} = require("../../models/booking");
const {Guest} = require("../../models/guest");
const {retrieveMainPhotobyPath, retrieveMainPhoto} = require("../../utils/retrieveImages");
const validateObjectId = require("../../middleware/validateObjectId");
const {OfflineGuest} = require("../../models/offlineGuest");
const convertBase64toImage = require("../../utils/convertBase64toImage");
const createFolder = require("../../utils/createFolder");
const validate = require("../../middleware/validate");

router.get("/staying", [auth, restaurantMiddleware], async (req, res) => {
  bookings = await Booking.find().where("status").eq("checkedin").lean();

  if (!bookings[0]) return res.status(404).send("No bookings available");

  let finalData = [];

  for (i = 0; i < bookings.length; i++) {
    let guest = await Guest.findById(bookings[i].guestId);
    if (!guest) guest = await OfflineGuest.findById(bookings[i].guestId);
    bookings[i]["name"] = guest.name;
    bookings[i]["email"] = guest.email;
    bookings[i]["phoneNumber"] = guest?.phoneNumber || "919164253030";
    finalData.push(bookings[i]);
  }
  res.send(finalData);
});

module.exports = router;
