const express = require("express");
const router = express.Router();
const _ = require("lodash");
const mongoose = require("mongoose");
const receptionMiddleware = require("../../middleware/reception");
const auth = require("../../middleware/auth");
const getDays = require("../../utils/getDays");
const {Hotel} = require("../../models/hotel");
const {Room} = require("../../models/room");
const {RoomBoy} = require("../../models/roomBoy");
const {Booking,validateBooking} = require("../../models/booking");
const {Guest} = require("../../models/guest");
const {retrieveMainPhotobyPath, retrieveMainPhoto} = require("../../utils/retrieveImages");
const validateObjectId = require("../../middleware/validateObjectId");
const {OfflineGuest} = require("../../models/offlineGuest");
const convertBase64toImage = require("../../utils/convertBase64toImage");
const createFolder = require("../../utils/createFolder");
const validate = require("../../middleware/validate");
const getCheckoutDate = require("../../utils/getCheckoutDate");
const bookedMail = require("../../services/bookedMail");
const bookedMessage = require("../../services/bookedMessage");
const checkinMail = require("../../services/checkinMail");
const checkinMessage = require("../../services/checkinMessage");
const checkoutMail = require("../../services/checkoutMail");
const checkoutMessage = require("../../services/checkoutMessage");

router.get("/", [auth, receptionMiddleware], async (req, res) => {
  let finalData = [];
  let bookings;

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
  var dateObj = new Date();
  let date = dateObj.getUTCDate();
  let month = dateObj.getUTCMonth() + 1; //months from 1-12
  let year = dateObj.getUTCFullYear();

  date = date.toString();
  if (date.length == 1) {
    date = "0" + date;
  }

  month = month.toString();
  if (month.length == 1) {
    month = "0" + month;
  }

  newdate = year + "-" + month + "-" + date;
  console.log(newdate);
  const bookings = await Booking.find().where("hotelId").in(req.user.hotelId)
    .where("startingDayOfStay")
    .eq(newdate)
    .where("status")
    .eq("yettostay")
    .lean();
  if (!bookings[0]) return res.status(404).send("No bookings for today");

  let finalData = [];

  for (i = 0; i < bookings.length; i++) {
    let guest = await Guest.findById(bookings[i].guestId);
    if (!guest) guest = await OfflineGuest.findById(bookings[i].guestId);
    bookings[i]["endingDayOfStay"]=getCheckoutDate(bookings[i]["endingDayOfStay"])
    bookings[i]["name"] = guest.name;
    bookings[i]["email"] = guest.email;
    bookings[i]["phoneNumber"] = guest?.phoneNumber || "919164253030";
    finalData.push(bookings[i]);
  }
  res.send(finalData);
});

router.get("/upcoming", [auth, receptionMiddleware], async (req, res) => {
  let {selectedDayRange} = req.query;
  let allTheDays;
  if (selectedDayRange) {
    selectedDayRange = JSON.parse(selectedDayRange);
    allTheDays = getDays(selectedDayRange);
  }

  var dateObj = new Date();
  let month = dateObj.getUTCMonth() + 1; //months from 1-12
  let date = dateObj.getUTCDate();
  let year = dateObj.getUTCFullYear();
  month = month.toString();
  if (month.length == 1) {
    month = "0" + month;
  }

  date = date.toString();
  if (date.length == 1) {
    date = "0" + date;
  }

  newdate = year + "-" + month + "-" + date;
  let bookings;
  if (selectedDayRange?.from) {
    bookings = await Booking.find()
      .where("startingDayOfStay")
      .gte(allTheDays[0])
      .lte(allTheDays[allTheDays.length - 1])
      .lean();
  } else {
    bookings = await Booking.find().where("startingDayOfStay").gt(newdate).lean();
  }
  if (!bookings[0]) return res.status(404).send("No bookings available");

  let finalData = [];

  for (i = 0; i < bookings.length; i++) {
    let guest = await Guest.findById(bookings[i].guestId);
    if (!guest) guest = await OfflineGuest.findById(bookings[i].guestId);
    bookings[i]["endingDayOfStay"]=getCheckoutDate(bookings[i]["endingDayOfStay"])
    bookings[i]["name"] = guest.name;
    bookings[i]["email"] = guest.email;
    bookings[i]["phoneNumber"] = guest?.phoneNumber || "919164253030";
    finalData.push(bookings[i]);
  }
  res.send(finalData);
});

router.get("/staying", [auth, receptionMiddleware], async (req, res) => {
  bookings = await Booking.find().where("status").eq("checkedin").lean();

  if (!bookings[0]) return res.status(404).send("No bookings available");

  let finalData = [];

  for (i = 0; i < bookings.length; i++) {
    let guest = await Guest.findById(bookings[i].guestId);
    if (!guest) guest = await OfflineGuest.findById(bookings[i].guestId);
    bookings[i]["endingDayOfStay"]=getCheckoutDate(bookings[i]["endingDayOfStay"])
    bookings[i]["name"] = guest.name;
    bookings[i]["email"] = guest.email;
    bookings[i]["phoneNumber"] = guest?.phoneNumber || "919164253030";
    finalData.push(bookings[i]);
  }
  res.send(finalData);
});

router.get("/details/:id", [auth, receptionMiddleware], async (req, res) => {
  //bugfix
  const booking = await Booking.findById(req.params.id).lean();
  console.log('test',req.params.id);
  let extraBed
  for (let [key, value] of Object.entries(booking.roomDetails)) {
    const room = await Room.findById(key);

    console.log(room,"rm")
    _.assign(value, _.pick(room, ["roomType", "availableRoomNumbers"]));
    const hotel = await Hotel.findById(room.hotelId).select({
      extraBed: 1,
      noOfExtraBeds: 1,
      pricePerExtraBed: 1,
    });

    if (hotel.extraBed) {
      value["pricePerExtraBed"] = hotel.pricePerExtraBed;
      value["noOfExtraBeds"] = hotel.noOfExtraBeds;
      console.log(hotel.extraBed,"he");
      extraBed=hotel.extraBed
    }
  }

  const roomBoys = await RoomBoy.find({currentHotelId:booking.hotelId}).select({name:1})
  console.log(roomBoys,"rbs")

  let guest;
  guest = await Guest.findById(booking.guestId);
  if (!guest) guest = await OfflineGuest.findById(booking.guestId);
  _.assign(booking, _.pick(guest, ["name", "phoneNumber", "email"]));
  let roomFinalDetails = [];
  for (let [key, value] of Object.entries(booking.roomDetails)) {
    _.range(value.numberOfRoomsBooked).map((room, index) => {
      value["roomNumber"] = "Select Room Number";
      value["roomBoy"] = "Select Room Boy";
      value["selectedExtraBed"] = 0;
      // value["adults"]=0
      // value["children"]=0
      // let tempObject={}
      value["roomId"] = key;
      // tempObject[key+index]=value
      roomFinalDetails.push(value);
    });
  }
  booking["roomFinalDetails"] = roomFinalDetails;
  booking["identityProof"] = "";
  booking["identityProofNumber"] = "";
  booking["address"] = "";
  booking["phoneNumber"] = booking["phoneNumber"]||"";
  booking["roomBoys"]=roomBoys
  booking["extraBed"]=extraBed
  booking["endingDayOfStay"]=getCheckoutDate(booking["endingDayOfStay"])
  console.log(booking,"vv")
  res.send(booking);
});

router.post("/checkin", [auth, receptionMiddleware,validate(validateBooking)], async (req, res) => {
  createFolder(req.user.email);

  req.body.identityProof = await convertBase64toImage(req.user.email, req.body.identityProof);
  for (let data of req.body.roomFinalDetails) {
    await Room.findByIdAndUpdate(data.roomId, {
      $pull: {availableRoomNumbers: {$in: [data.roomNumber]}},
    });

    // await RoomBoy.findByIdAndUpdate(data.roomBoyId,{$push:{}})

  }
  let checkinRoomDetails=[]
  req.body.roomFinalDetails.map(details=>checkinRoomDetails.push(_.pick(details,["roomNumber","selectedExtraBed","adults","children","roomBoyId"])))

  const booking=await Booking.findByIdAndUpdate(req.body._id, {
    $set: {
      status: "checkedin",
      roomFinalDetails: checkinRoomDetails,
      identityProof: req.body.identityProof,
      identityProofNumber: req.body.identityProofNumber,
    },
  },{new:true});

  guest = await Guest.findById(booking.guestId);
  if (!guest) guest = await OfflineGuest.findById(booking.guestId);

  
  guest["phoneNumber"]=req.body.phoneNumber
  guest["address"]=req.body.address
  guest.save().then(()=>{
    if(guest.email){
      checkinMail(guest.email,booking)
    }
  
    if(guest.phoneNumber){
      checkinMessage(booking,guest.phoneNumber)
    }
  })


  res.send("done");
});

router.get("/checkout/:id", [auth, receptionMiddleware], async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if(booking.status!=="checkedin") return res.status(400).send("Something went wrong")
  let hotel=await Hotel.findById(booking.hotelId)
  let price = 0;
  let accomodationTotal=0
  for (let data of booking.roomFinalDetails) {
    const room=await Room.find().where("roomNumbers").in(data.roomNumber)
    accomodationTotal+=room[0].basePricePerNight
    accomodationTotal+=data.selectedExtraBed*hotel.pricePerExtraBed
  }

  let restaurantBillAmount=0

  booking.restaurantBill.map(item=>{
    restaurantBillAmount+=item.itemPrice*item.itemQuantity
  })

  price+=restaurantBillAmount+accomodationTotal

  let guest = await Guest.findById(booking.guestId).lean();
  if (!guest) guest = await OfflineGuest.findById(booking.guestId).lean();
  guest["price"] = price;
  guest["restaurantBillAmount"] =restaurantBillAmount
  guest["accomodationTotal"] =accomodationTotal
  res.send(guest);
});

router.post("/checkout/:id", [auth, receptionMiddleware], async (req, res) => {
  console.log(req.body,"aa")
  const booking=await Booking.findByIdAndUpdate(req.params.id, {$set: {status: "checkedout",additionalCharges:req.body.items}},{new: true});

  let guest = await Guest.findById(booking.guestId).lean();
  if (!guest) guest = await OfflineGuest.findById(booking.guestId).lean();
  if(guest.email){
    await checkoutMail(guest.email,booking)
  }
  if(guest.phoneNumber){
    await checkoutMessage(booking,guest.phoneNumber)
  }
  res.send("done");
});

router.get("/completed", [auth, receptionMiddleware], async (req, res) => {
  let {selectedDayRange} = req.query;
  let allTheDays;
  if (selectedDayRange) {
    selectedDayRange = JSON.parse(selectedDayRange);
    allTheDays = getDays(selectedDayRange);
  }

  var dateObj = new Date();
  let month = dateObj.getUTCMonth() + 1; //months from 1-12
  let date = dateObj.getUTCDate();
  let year = dateObj.getUTCFullYear();
  month = month.toString();
  if (month.length == 1) {
    month = "0" + month;
  }

  date = date.toString();
  if (date.length == 1) {
    date = "0" + date;
  }

  newdate = year + "-" + month + "-" + date;
  let bookings;
  if (selectedDayRange?.from) {
    bookings = await Booking.find()
      .where("endingDayOfStay")
      .gte(allTheDays[0])
      .lte(allTheDays[allTheDays.length - 1])
      .where("status")
      .eq("checkedout")
      .lean();
  } else {
    bookings = await Booking.find().where("status").eq("checkedout").lean();
  }
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

router.post("/", [auth, receptionMiddleware], async (req, res) => {
  const {roomDetails, selectedDayRange, hotelId, offlineGuestId} = req.body;
  if (!mongoose.Types.ObjectId.isValid(hotelId)) return res.status(404).send("Invalid hotel Id");
  for (room of roomDetails) {
    if (!mongoose.Types.ObjectId.isValid(room.roomId))
      return res.status(404).send("Invalid room Id");
  }

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
  }

  const bookingsCount=await Booking.find().count()

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
  roomData["hotelBookingId"]=""+Math.floor(Math.random() * (99 - 10 + 1) + 10)+bookingsCount
  // roomData["totalPrice"] = totalPrice;

  const booking = new Booking(roomData);
  await booking.save();

  const offlineGuestData=await OfflineGuest.findByIdAndUpdate(offlineGuestId, {$push: {bookedHotelDetails: booking._id}});
  if(offlineGuestData.email){
    await bookedMail(offlineGuestData.email,booking,offlineGuestData.name)
  }
  if(offlineGuestData.phoneNumber){
    await bookedMessage(booking.hotelBookingId,offlineGuestData.phoneNumber)
  }
  res.send("Successfully booked");
});

module.exports = router;
