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
const days = require("days-in-a-row");
const JSJoda = require("js-joda");

router.get("/", async (req, res) => {
  let {placeForSearch, selectedDayRange, pageNumber, pageSize, filterOptions, hotelId} = req.query;
  pageNumber = Number(pageNumber);
  pageSize = Number(pageSize);
  console.log(placeForSearch, "ps");
  console.log(selectedDayRange, "ps");
  // placeForSearch = placeForSearch.toLowerCase();
  let allTheDays;
  selectedDayRange = JSON.parse(selectedDayRange);

  if (selectedDayRange.from) {
    allTheDays = getDays(selectedDayRange);
  }

  let hotel = [await Hotel.findOne({city: placeForSearch})];
  if (!hotel[0]) hotel = [await Hotel.findById(hotelId)];
  if (!hotel[0]) return res.status(404).send("hotel with given id not found");

  hotel = await retrieveMainPhoto(hotel);
  hotel = await retrieveOtherPhotos(hotel);
  let data = {hotels: hotel, numberOfDays: allTheDays?.length};
  res.send(data);

  //   let hotelFacilities = [
  //     "Free Wifi",
  //     "Garden",
  //     "Water park",
  //     "Spa and wellness centre",
  //     "Terrace",
  //     "Fitness centre",
  //     "Restaurant",
  //     "Room service",
  //     "Bar",
  //     "Hot tub/jacuzzi",
  //     "Swimming pool",
  //     "AC",
  //   ];

  //   let otherFacilities = [
  //     "parking",
  //     "extraBed",
  //     "breakfast",
  //     "accomodateChildren",
  //     "allowPets",
  //     "provideDormitoryForDriver",
  //   ];

  //   let roomFacilities = ["Air Conditioning", "Smart TV", "Television"];
  //   let starRating = ["1 Star", "2 Star", "3 Star", "4 Star", "5 Star"];
  //   let rating = ["Above 4/5", "Above 3/5", "Above 2/5"];

  //   let filteredHotelFacilities = _.intersection(hotelFacilities, filterOptions);
  //   let filteredRoomFacilities = _.intersection(roomFacilities, filterOptions);
  //   let filteredStarRating = _.intersection(starRating, filterOptions);
  //   let filteredRating = _.intersection(rating, filterOptions);

  //   if (filteredStarRating.length > 0) {
  //     let temp = [];
  //     for (let element of filteredStarRating) temp.push(Number(_.head(element)));
  //     filteredStarRating = temp;
  //   } else {
  //     filteredStarRating = [0, 1, 2, 3, 4, 5];
  //   }

  //   if (filteredRating.length > 0)
  //     filteredRating = Number(_.nth(_.last(_.sortBy(filteredRating)), 6));
  //   else filteredRating = 0;

  //   let filteredFields = _.pullAll(
  //     filterOptions,
  //     _.flattenDeep([hotelFacilities, roomFacilities, starRating, rating])
  //   );

  //   if (filteredFields) {
  //     filteredFields = _.intersection(
  //       otherFacilities,
  //       filteredFields.map(item => _.camelCase(item))
  //     );
  //   }

  //   let extraBed = filteredFields?.includes("extraBed") ? true : [true, false];
  //   let allowPets = filteredFields?.includes("allowPets") ? true : [true, false];
  //   let parking = filteredFields?.includes("parking")
  //     ? ["Yes, Free", "Yes, Paid"]
  //     : ["No", "Yes, Free", "Yes, Paid"];
  //   let breakfast = filteredFields?.includes("breakfast")
  //     ? ["Yes, Free", "Yes, Paid"]
  //     : ["No", "Yes, Free", "Yes, Paid"];
  //   let accomodateChildren = filteredFields?.includes("accomodateChildren") ? true : [true, false];
  //   let provideDormitoryForDriver = filteredFields?.includes("provideDormitoryForDriver")
  //     ? true
  //     : [true, false];

  //   let selectedProperties = {
  //     hotelName: 1,
  //     reviewScore: 1,
  //     startingRatePerDay: 1,
  //     mainPhoto: 1,
  //     city: 1,
  //   };

  //   let allTheDays;
  //   selectedDayRange=JSON.parse(selectedDayRange)

  //   if (selectedDayRange.from) {
  //     allTheDays = getDays(selectedDayRange);
  //   } else {
  //     function getQuery() {
  //       let hotelsQuery = Hotel.find({placeForSearch})
  //         .where("provideDormitoryForDriver")
  //         .in(provideDormitoryForDriver)
  //         .where("accomodateChildren")
  //         .in(accomodateChildren)
  //         .where("starRating")
  //         .in(filteredStarRating)
  //         .where("reviewScore")
  //         .gte(filteredRating)
  //         .where("breakfast")
  //         .in(breakfast)
  //         .where("allowPets")
  //         .in(allowPets)
  //         .where("extraBed")
  //         .in(extraBed)
  //         .where("parking")
  //         .in(parking);

  //       if (filteredHotelFacilities.length > 0)
  //         return hotelsQuery
  //           .where("facilities")
  //           .all(filteredHotelFacilities)
  //           .in(filteredHotelFacilities);

  //       return hotelsQuery;
  //     }

  //     let hotelsQuery = getQuery();

  //     const roomIds = await hotelsQuery.distinct("hotelRooms");

  //     let roomsQuery = Room.find().where("_id").in(roomIds)
  //     if (filteredRoomFacilities.length > 0) {
  //       roomsQuery = roomsQuery
  //         .where("facilities")
  //         .all(filteredRoomFacilities)
  //         .in(filteredRoomFacilities);
  //     }

  //     const hotelIds = await roomsQuery.distinct("hotelId");

  //     hotelsQuery = getQuery();
  //     let hotels = await Hotel.find()
  //       .where("_id")
  //       .in(hotelIds)
  //       .select(selectedProperties)
  //       .skip(pageNumber * pageSize)
  //       .limit(pageSize);

  //     let hotelsCount = await Hotel.find().where("_id").in(hotelIds).countDocuments();

  //     hotels = await retrieveMainPhoto(hotels);
  //     hotels = {hotelsCount, hotels,numberOfDays:0};
  //     return res.send(hotels);
  //   }

  // //? Search with Date

  //   let roomIds = await Hotel.find({placeForSearch}).distinct("hotelRooms")

  //   let hotelIds = await Room.find()
  //     .where("_id")
  //     .in(roomIds)
  //     .where("bookingFullDates")
  //     .nin(allTheDays)
  //     .distinct("hotelId")

  //     roomIds=await Hotel.find().where("_id").in(hotelIds).distinct("hotelRooms")

  //   let roomsQuery = Room.find().where("_id").in(roomIds)

  //   if (filteredRoomFacilities.length > 0) {
  //     roomsQuery = roomsQuery
  //       .where("facilities")
  //       .all(filteredRoomFacilities)
  //       .in(filteredRoomFacilities);
  //   }

  // hotelIds = await roomsQuery.find().distinct("hotelId")

  // function getQuery() {
  //   let hotelsQuery = Hotel.find()
  //     .where("_id")
  //     .in(hotelIds)
  //     .where("provideDormitoryForDriver")
  //     .in(provideDormitoryForDriver)
  //     .where("accomodateChildren")
  //     .in(accomodateChildren)
  //     .where("starRating")
  //     .in(filteredStarRating)
  //     .where("reviewScore")
  //     .gte(filteredRating)
  //     .where("breakfast")
  //     .in(breakfast)
  //     .where("allowPets")
  //     .in(allowPets)
  //     .where("extraBed")
  //     .in(extraBed)
  //     .where("parking")
  //     .in(parking);

  //     if (filteredHotelFacilities.length > 0)
  //       return hotelsQuery
  //         .where("facilities")
  //         .all(filteredHotelFacilities)
  //         .in(filteredHotelFacilities);

  //     return hotelsQuery;
  //   }

  //   let hotelsQuery = getQuery();

  //   let hotels = await hotelsQuery
  //     .select(selectedProperties)
  //     .skip(pageNumber * pageSize)
  //     .limit(pageSize);

  //   hotelsQuery = getQuery();

  //   let hotelsCount = await hotelsQuery.countDocuments();

  //   for (hotel of hotels) hotel.startingRatePerDay *= allTheDays.length;

  //   hotels = await retrieveMainPhoto(hotels);

  //   res.send({hotels, hotelsCount,numberOfDays:allTheDays.length});
});

//? API get request roomData for getting rooms
// {
//   "placeForSearch": "hampi",
//   "selectedDate":{"date":{"from":{
//   "day":19,
//   "month":5,
//   "year":2021
// },
// "to":{
//   "day":21,
//   "month":5,
//   "year":2021
// }}}
// }

router.get("/:id", [validateObjectId], async (req, res) => {
  console.log("abc");
  let hotel = [await Hotel.findById(req.params.id)];
  if (!hotel[0]) return res.status(404).send("hotel with given id not found");
  hotel = await retrieveMainPhoto(hotel);
  hotel = await retrieveOtherPhotos(hotel);
  res.send(hotel);
});

router.post("/", [auth, guestMiddleware], async (req, res) => {
  const {roomDetails, selectedDayRange, hotelId} = req.body;
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

  const bookingsCount=await Booking.find().count()

  console.log(allTheDays, "ad");
  const roomData = {};
  roomData["guestId"] = req.user._id;
  roomData["hotelId"] = hotelId;
  roomData["bookedOn"] = new Date().toLocaleString("en-us", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  roomData["startingDayOfStay"] = allTheDays[0];
  roomData["endingDayOfStay"] = allTheDays[allTheDays.length - 1];
  roomData["roomDetails"] = roomsDetails;
  roomData["bookingMode"] = "online";
  roomData["hotelBookingId"]=""+Math.floor(Math.random() * (99 - 10 + 1) + 10)+bookingsCount
  // roomData["totalPrice"] = totalPrice;

  const newBooking = new Booking(roomData);
  await newBooking.save();

  await Guest.findByIdAndUpdate(req.user._id, {$push: {bookedHotelDetails: newBooking._id}});
  res.send("Successfully booked");
});

router.delete("/:id", async (req, res) => {
  const LocalDate = JSJoda.LocalDate;
  const booking = await Booking.findByIdAndDelete(req.params.id);
  console.log(booking, "bkng");
  const start_date = new LocalDate.parse(booking.startingDayOfStay);
  const end_date = new LocalDate.parse(booking.endingDayOfStay);

  const totalDays = days(
    new Date(booking.startingDayOfStay),
    JSJoda.ChronoUnit.DAYS.between(start_date, end_date) + 1
  );
  console.log(totalDays, "td");
  for (let [key, value] of Object.entries(booking.roomDetails)) {
    console.log(key, "ky");
    const room = await Room.findById(key);
    totalDays.map(day => {
      room.numberOfBookingsByDate[day] =
        room?.numberOfBookingsByDate[day] - value.numberOfRoomsBooked;
    });
    room.bookingFullDates = _.difference(room.bookingFullDates, totalDays);
    room.markModified("numberOfBookingsByDate", "bookingFullDates");
    await room.save();
  }

  res.send("Successfully cancelled booking");
});

//? API post request request roomData for booking rooms
// {
//   "roomDetails":[{"roomId": "60995ece56a3f64368509ce9",
//         "noOfRooms":3
//       },
//       {
//         "roomId":"60995ee156a3f64368509cea",
//         "noOfRooms":2
//       }],
//   "selectedDate":{"date":{"from":{
//   "day":19,
//   "month":5,
//   "year":2021
// },
// "to":{
//   "day":29,
//   "month":5,
//   "year":2021
// }}}
// }

module.exports = router;



// let apikey="M4rze2ErDeeNfmdKAaio3rmPHzJY7IChArWRfjeQGgjVeJyTkrctE8IHTG4V"

// var fast2sms = require('fast-two-sms');
// var options = {API_KEY:apikey};
// fast2sms.sendMessage({ authorization : apikey,message: 'Testing hotel book', numbers : ['8137833845'],sender_id:"sashi" }).then(function (data) {
//     console.log('data................', data);
// }).catch(function (error) {
//     console.log('err.................', error);
// })