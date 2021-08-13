const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const findRenter = require("../../utils/findRenter");
const validate = require("../../middleware/validate");
const {validateRenterPassword} = require("../../models/renter");
const mailService = require("../../services/mailService");
const {encrypt, decrypt} = require("../../utils/encryption");

router.post("/", async (req, res) => {
  let {userId} = req.body;
  let renter = await findRenter(userId);
  if (!renter)
    return res.status(400).send({
      property: "userId",
      msg: "There is no user with given email id or username",
    });

  let resetToken = renter.generateResetToken();
  let encryptedResetToken = encrypt(resetToken);
  renter.resettoken = encryptedResetToken;
  await renter.save();
  mailService(renter["email"], resetToken, renter?.name);
  console.log(resetToken);
  res.send("Link Sent Successfully");
});

router.put("/:token", validate(validateRenterPassword), async (req, res) => {
  let token = req.params.token;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_CHANGEPASSWORD_PRIVATE_KEY);
  } catch (ex) {
    return res.status(400).send("This link is invalid.");
  }

  let renter = await findRenter(decoded.email);
  if (!renter) return res.status(400).send("Something went wrong. Try again");

  if (!renter.resettoken) return res.status(400).send("This link is invalid");

  let decryptedResetToken = decrypt(renter.resettoken);
  if (token !== decryptedResetToken) return res.status(400).send("Something went wrong. Try again");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  renter.password = hashedPassword;
  renter.resettoken = null;
  await renter.save();
  res.send("Password changed successfully");
});

module.exports = router;
