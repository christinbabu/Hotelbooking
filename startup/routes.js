const express = require("express");

const adminSignin = require("../routes/admin/signin");
const adminSignup = require("../routes/admin/signup");
const adminForgot = require("../routes/admin/forgot");
const verify = require("../routes/admin/verify");
const adminChangePassword = require("../routes/admin/changePassword");

const guestSignin = require("../routes/guest/signin");
const guestSignup = require("../routes/guest/signup");
const guestForgot = require("../routes/guest/forgot");
const book = require("../routes/guest/book");
const bookings = require("../routes/guest/bookings");
const getrooms = require("../routes/guest/rooms");
const reviews = require("../routes/guest/reviews");
const guestChangePassword = require("../routes/guest/changePassword");

const renterSignin = require("../routes/renter/signin");
const renterSignup = require("../routes/renter/signup");
const renterForgot = require("../routes/renter/forgot");
const hotels = require("../routes/renter/hotels");
const rooms = require("../routes/renter/rooms");
const renterChangePassword = require("../routes/renter/changePassword");

module.exports = function (app) {
  app.use(express.json({limit: '50mb'}));
  app.use("/api/admin/signin", adminSignin);
  app.use("/api/admin/signup", adminSignup);
  app.use("/api/admin/forgot", adminForgot);
  app.use("/api/admin/verify", verify);
  app.use("/api/admin/changePassword", adminChangePassword);

  app.use("/api/guest/signin", guestSignin);
  app.use("/api/guest/signup", guestSignup);
  app.use("/api/guest/forgot", guestForgot);
  app.use("/api/guest/book", book);
  app.use("/api/guest/bookings", bookings);
  app.use("/api/guest/room", getrooms);
  app.use("/api/guest/review", reviews);
  app.use("/api/guest/changePassword", guestChangePassword);

  app.use("/api/renter/signin", renterSignin);
  app.use("/api/renter/signup", renterSignup);
  app.use("/api/renter/forgot", renterForgot);
  app.use("/api/renter/hotel", hotels);
  app.use("/api/renter/room", rooms);
  app.use("/api/renter/changePassword", renterChangePassword);
};
