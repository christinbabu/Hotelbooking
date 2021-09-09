const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const findRestaurant = require("../../utils/findRestaurant");
const validate = require("../../middleware/validate");
const {validateRestaurantPassword} = require("../../models/restaurant");
const resetPasswordMail = require("../../services/resetPasswordMail");
const {encrypt, decrypt} = require("../../utils/encryption");

router.post("/", async (req, res) => {
  let {userId} = req.body;
  let restaurant = await findRestaurant(userId);
  if (!restaurant)
    return res.status(400).send({
      property: "userId",
      msg: "There is no user with given email id or username",
    });

  let resetToken = restaurant.generateResetToken();
  let encryptedResetToken = encrypt(resetToken);
  restaurant.resettoken = encryptedResetToken;
  await restaurant.save();
  resetPasswordMail(restaurant["email"], resetToken, restaurant?.name);
  console.log(resetToken);
  res.send("Link Sent Successfully");
});

router.put("/:token", validate(validateRestaurantPassword), async (req, res) => {
  let token = req.params.token;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_CHANGEPASSWORD_PRIVATE_KEY);
  } catch (ex) {
    return res.status(400).send("This link is invalid.");
  }

  let restaurant = await findRestaurant(decoded.email);
  if (!restaurant) return res.status(400).send("Something went wrong. Try again");

  if (!restaurant.resettoken) return res.status(400).send("This link is invalid");

  let decryptedResetToken = decrypt(restaurant.resettoken);
  if (token !== decryptedResetToken) return res.status(400).send("Something went wrong. Try again");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  restaurant.password = hashedPassword;
  restaurant.resettoken = null;
  await restaurant.save();
  res.send("Password changed successfully");
});

module.exports = router;
