const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendEmailVerification = (email, token) => {
  const url = `https://www.cirqls.app/signup/${token}`;

  const messageText = `Hi,
  Welcome to Cirqls! You're almost done creating an account!
  To continue, please verify your email address by clicking the link below.
  ${url}`;

  const messageHtml = `<p>Hi,</p>
  <p>Welcome to Cirqls! You're almost done creating an account!</p>
  <p>To continue, please verify your email address by clicking the button below.</p>
  <a clicktracking=off href="${url}"><button>Verify Email Address</button></a>`;

  const message = {
    to: email,
    from: {
      name: "Cirqls",
      email: "noreply@cirqls.app",
    },
    subject: "Verify Your Cirqls Email Address",
    text: messageText,
    html: messageHtml,
  };

  sgMail
    .send(message)
    .then((response) => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.log(error.message);
    });
};
