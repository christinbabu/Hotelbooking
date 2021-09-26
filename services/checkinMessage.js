const fast2sms = require("fast-two-sms");

module.exports = function (booking, phoneNumber) {
  phoneNumber = phoneNumber.toString();
  if (phoneNumber.charAt(0) == "+") {
    phoneNumber = phoneNumber.substring(3, Infinity);
  } else {
    phoneNumber.substring(2, Infinity);
  }

  let message = `You have successfully checkedin to your room. 
  Your room numbers are ${booking.roomFinalDetails.map(data => data.roomNumber + ", ")}`;

  fast2sms
    .sendMessage({
      authorization: process.env.MESSAGE_API_KEY,
      message,
      numbers: [phoneNumber],
    })
    .then(function (data) {
      console.log("data................", data);
    })
    .catch(function (error) {
      console.log("err.................", error);
    });
};
