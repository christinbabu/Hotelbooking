const express = require("express");
const router = express.Router();
const _ = require("lodash");
const mongoose = require("mongoose");
const receptionMiddleware = require("../../middleware/reception");
const auth = require("../../middleware/auth");
const getDays = require("../../utils/getDays");
const {Hotel} = require("../../models/hotel");
const {Room} = require("../../models/room");
const {Booking} = require("../../models/booking");
const {Guest} = require("../../models/guest");
const {retrieveMainPhotobyPath, retrieveMainPhoto} = require("../../utils/retrieveImages");
const validateObjectId = require("../../middleware/validateObjectId");
const {OfflineGuest} = require("../../models/offlineGuest");

router.get("/", [auth, receptionMiddleware], async (req, res) => {
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

router.get("/guest", [auth, receptionMiddleware], async (req, res) => {
  const {roomIds} = req.query;
  let finalRoomsData = [];
  let rooms = [await Room.find().where("_id").in(roomIds).lean()];

  for (let room of rooms) {
    finalRoomsData.push(await retrieveMainPhoto(room));
  }

  return res.send(_.flattenDeep(finalRoomsData));
});

router.get("/todays", [auth, receptionMiddleware], async (req, res) => {
  console.log("aa");
  var dateObj = new Date();
let month = dateObj.getUTCMonth() + 1; //months from 1-12
let day = dateObj.getUTCDate();
let year = dateObj.getUTCFullYear();
month=month.toString()
if(month.length==1){
  month="0"+month
}

newdate = year + "-" + month + "-" + day;
console.log(newdate);
  const bookings = await Booking.find({
    startingDayOfStay: newdate,
  }).lean();
  if(!bookings[0]) return res.status(404).send("No bookings for today")

  let finalData=[]
  console.log(bookings)
  // _.each(bookings, async (booking,index)=>{
  //   let guest= await Guest.findById(booking.guestId)
  //   if(!guest) guest= await OfflineGuest.findById(booking.guestId)
  //   console.log(guest,"gst")
  //   bookings[index]["name"] = guest.name
  //   bookings[index]["email"] = guest.email
  //   bookings[index]["phoneNumber"] = guest?.phoneNumber||"919164253030"
  //   finalData.push(bookings[index])
  //   console.log(index,"i")
  //   if (index == bookings.length - 1) {
  //     sendData();
  //   }
  // })
  // setTimeout(()=>{
  //   console.log(finalData)
  //     res.send(finalData);
  // },3000)

  for(i=0; i<bookings.length; i++){
      let guest= await Guest.findById(bookings[i].guestId)
    if(!guest) guest= await OfflineGuest.findById(bookings[i].guestId)
    console.log(guest,"gst")
    bookings[i]["name"] = guest.name
    bookings[i]["email"] = guest.email
    bookings[i]["phoneNumber"] = guest?.phoneNumber||"919164253030"
    finalData.push(bookings[i])
  }
res.send(finalData)
  function sendData() {
    console.log("sending");
    // console.log(finalData);
    res.send(finalData);
  }
});

router.post("/", [auth, receptionMiddleware], async (req, res) => {
  const {roomDetails, selectedDayRange, hotelId, offlineGuestId} = req.body;
  if (!mongoose.Types.ObjectId.isValid(hotelId)) return res.status(404).send("Invalid hotel Id");
  for (room of roomDetails) {
    if (!mongoose.Types.ObjectId.isValid(room.roomId))
      return res.status(404).send("Invalid room Id");
  }

  console.log(selectedDayRange, "sdr");
  const allTheDays = getDays(selectedDayRange);
  const roomsDetails = {};
  // let totalPrice = 0;

  for (room of roomDetails) {
    let roomDB = await Room.findById(room.roomId);

    roomsDetails[room.roomId] = {
      numberOfRoomsBooked: room.noOfRooms,
      pricePerRoom: roomDB.basePricePerNight,
      beds: roomDB.numberOfBeds,
      guests: roomDB.numberOfGuestsInaRoom,
    };

    // totalPrice += roomDB.basePricePerNight * room.noOfRooms;

    for (date of allTheDays) {
      if (!roomDB?.numberOfBookingsByDate) roomDB.numberOfBookingsByDate = {};
      if (date in roomDB?.numberOfBookingsByDate) {
        roomDB.numberOfBookingsByDate[date] += room.noOfRooms;
        if (roomDB?.numberOfBookingsByDate[date] == roomDB?.numberOfRoomsOfThisType)
          roomDB?.bookingFullDates.push(date);
        if (roomDB?.numberOfBookingsByDate[date] > roomDB?.numberOfRoomsOfThisType)
          return res.status(400).send("Someone already booked, please refresh your page.");
      } else {
        roomDB.numberOfBookingsByDate[date] = room.noOfRooms;
        if (roomDB?.numberOfBookingsByDate[date] == roomDB?.numberOfRoomsOfThisType)
          roomDB?.bookingFullDates.push(date);
        if (roomDB?.numberOfBookingsByDate[date] > roomDB?.numberOfRoomsOfThisType)
          return res.status(400).send("Someone already booked, please refresh your page.");
      }
    }

    roomDB.markModified("numberOfBookingsByDate", "bookingFullDates");
    await roomDB.save();
    console.log(roomDB);
  }
  console.log(allTheDays, "ad");
  const roomData = {};
  roomData["guestId"] = offlineGuestId;
  roomData["hotelId"] = hotelId;
  roomData["bookedOn"] = new Date().toLocaleString("en-us", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  roomData["startingDayOfStay"] = allTheDays[0];
  roomData["endingDayOfStay"] = allTheDays[allTheDays.length - 1];
  roomData["roomDetails"] = roomsDetails;
  roomData["bookingMode"] = "offline";
  // roomData["totalPrice"] = totalPrice;

  const booking = new Booking(roomData);
  await booking.save();

  await OfflineGuest.findByIdAndUpdate(offlineGuestId, {$push: {bookedHotelDetails: booking._id}});
  res.send("Successfully booked");
});

module.exports = router;
