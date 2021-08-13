const convertBase64toImage = require("./convertBase64toImage");

module.exports = async function (req) {
  req.body.mainPhoto = await convertBase64toImage(req.user.username, req.body.mainPhoto);

  let photos = [];
  if (req.body.photos.length > 0)
    for (let image of req.body.photos)
      photos.push(await convertBase64toImage(req.user.username, image));
  req.body.photos = photos;
};
 