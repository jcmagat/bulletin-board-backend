const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

exports.sendEmailVerification = async (email, token) => {
  // TODO: change before pushing to production
  const url = `http://localhost:3000/signup/${token}`;

  await transporter.sendMail({
    to: email,
    subject: "Verify Your Cirqls Email Address",
    html: `<p>Hi,</p>
    <p>Welcome to Cirqls! You're almost done...</p>
    <p>To continue signing up for a Cirqls account, please verify your email address
    by clicking the button below.</p>
    <a href="${url}"><button>Verify Email Address</button></a>`,
  });
};
