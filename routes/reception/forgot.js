const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const findReception = require("../../utils/findReception");
const validate = require("../../middleware/validate");
const {validateReceptionPassword} = require("../../models/reception");
const mailService = require("../../services/mailService");
const {encrypt, decrypt} = require("../../utils/encryption");

router.post("/", async (req, res) => {
  let {userId} = req.body;
  let reception = await findReception(userId);
  if (!reception)
    return res.status(400).send({
      property: "userId",
      msg: "There is no user with given email id or username",
    });

  let resetToken = reception.generateResetToken();
  let encryptedResetToken = encrypt(resetToken);
  reception.resettoken = encryptedResetToken;
  await reception.save();
  mailService(reception["email"], resetToken, reception?.name);
  console.log(resetToken);
  res.send("Link Sent Successfully");
});

router.put("/:token", validate(validateReceptionPassword), async (req, res) => {
  let token = req.params.token;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_CHANGEPASSWORD_PRIVATE_KEY);
  } catch (ex) {
    return res.status(400).send("This link is invalid.");
  }

  let reception = await findReception(decoded.email);
  if (!reception) return res.status(400).send("Something went wrong. Try again");

  if (!reception.resettoken) return res.status(400).send("This link is invalid");

  let decryptedResetToken = decrypt(reception.resettoken);
  if (token !== decryptedResetToken) return res.status(400).send("Something went wrong. Try again");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  reception.password = hashedPassword;
  reception.resettoken = null;
  await reception.save();
  res.send("Password changed successfully");
});

module.exports = router;
