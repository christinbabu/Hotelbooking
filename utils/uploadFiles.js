const multer = require("multer");

module.exports = function (req, res, folder, returnFileName) {
  let name = "";
  let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `public/${folder}`);
    },

    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  var upload = multer({storage: storage}).single("mainPhoto");

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) { 
      // return returnFileName({err, name});
    } else if (err) { 
      // return returnFileName({err, name});
    }
    // err = "";
    // console.log(req.mainPhoto,"z")
    // name = req.file.filename;
    // returnFileName({err, name});
  });
};
