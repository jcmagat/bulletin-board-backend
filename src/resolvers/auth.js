const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (parent, args) => {
  const username = args.username;
  const password = args.password;

  const user = await User.findOne({ username: username });
  if (!user) {
    throw new Error("User does not exist");
  }

  const successfulLogin = await bcrypt.compare(password, user.password);
  if (!successfulLogin) {
    throw new Error("Incorrect password");
  }

  const payload = {
    username: username,
  };
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.TOKEN_EXPIRES_IN,
  });

  const authData = {
    username: username,
    accessToken: accessToken,
    tokenExpiration: process.env.TOKEN_EXPIRES_IN,
  };
  return authData;
};
