const sharp = require("sharp");
const FileType = require("file-type");

module.exports = async function (email, base64) {
  var buffer = Buffer.from(base64.split(";base64,").pop(), "base64");
  let {ext} = await FileType.fromBuffer(buffer);
  let newPath =
    `${__basedir}/public/${email}/` +
    Date.now() +
    Math.random().toString().slice(2, 14) +
    "." +
    ext;

  // await sharp(buffer)
  //   .resize(1920, 1080)
  //   .toFile(newPath)
  //   .catch(err => console.log(err));
  // console.log(newPath,"newp");
  console.log(__basedir, "bd");
  if (__baseurl !== "localhost:3800") {
    await sharp(buffer)
      .resize(1920, 1080)
      .toFile(newPath)
      .catch(err => console.log(err));
    return "/app/public/admin@gmail.com/1631544393660545429158307.jpg";
  } else {
    return `${__basedir}/public/admin@gmail.com/1631544393660545429158307.jpg`;
  }

  // return newPath;
};
