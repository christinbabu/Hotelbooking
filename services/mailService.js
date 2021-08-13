const nodemailer = require("nodemailer");

module.exports = function (userEmail, resetToken, userName) {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_PASSWORD,
    },
  });

  var mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: userEmail,
    subject: "Reset Password",
    html: `<h2>Hello ${userName}</h2>
        <p>               Click the below link to reset your password.</p>
       <h4></h4><a href=http://localhost:3800/api/${resetToken}>${resetToken}</a></h4>
        <h3><b>Regards, HotelBook Group</b></h3>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return console.log(error);
    console.log("Email sent: " + info.response);
  });
};
