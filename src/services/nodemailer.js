const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.sendEmailVerification = (email, token) => {
  const url = `https://www.cirqls.app/signup/${token}`;

  const emailOptions = {
    to: email,
    subject: "Verify Your Cirqls Email Address",
    html: `<p>Hi,</p>
    <p>Welcome to Cirqls! You're almost done...</p>
    <p>To continue signing up for a Cirqls account, please verify your email address
    by clicking the button below.</p>
    <a href="${url}"><button>Verify Email Address</button></a>`,
  };

  transporter.sendMail(emailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(info);
    }
  });
};
