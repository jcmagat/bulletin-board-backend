const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (parent, args) => {
  const email = args.email;
  const username = args.username;
  const password = args.password;
  const hashedPassword = await bcrypt.hash(password, 10);

  const emailRegistered = await User.findOne({ email: email });
  if (emailRegistered) {
    throw new Error("Email is already registered");
  }

  const usernameTaken = await User.findOne({ username: username });
  if (usernameTaken) {
    throw new Error("Username is already taken");
  }

  await User.create({
    email: email,
    username: username,
    password: hashedPassword,
  });

  const register = {
    registered: true,
  };
  return register;
};

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
    expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
  });

  const authData = {
    username: username,
    accessToken: accessToken,
    refreshToken: refreshToken,
    accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION,
    refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION,
  };
  return authData;
};
