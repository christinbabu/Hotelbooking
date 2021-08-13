const {Renter} = require("../models/renter");

module.exports = async function (userId) {
  let user;
  userId = userId.toLowerCase();

  user = await Renter.findOne({
    email: userId,
  });

  if (!user) {
    user = await Renter.findOne({
      username: userId,
    });
  }
  return user;
};
