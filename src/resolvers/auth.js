const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ApolloError, UserInputError } = require("apollo-server-errors");

exports.register = async (parent, args) => {
  try {
    const email = args.email;
    const username = args.username;
    const password = args.password;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = await pool.query(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING *",
      [email, username, hashedPassword]
    );
  } catch (error) {
    if (error.constraint === "users_email_key") {
      throw new UserInputError("Email is already registered");
    } else if (error.constraint === "users_username_key") {
      throw new UserInputError("Username is already taken");
    } else {
      throw new ApolloError("Internal server error");
    }
  }

  const register = {
    registered: true,
  };

  return register;
};

exports.login = async (parent, args) => {
  const username = args.username;
  const password = args.password;

  const query = await pool.query("SELECT * FROM users WHERE username = ($1)", [
    username,
  ]);

  const user = query.rows[0];
  if (!user) {
    throw new UserInputError("Incorrect username or password");
  }

  const isCorrectPassword = await bcrypt.compare(password, user.password);
  if (!isCorrectPassword) {
    throw new UserInputError("Incorrect username or password");
  }

  const payload = {
    user_id: user.user_id,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
  });

  const authData = {
    user_id: user.user_id,
    accessToken: accessToken,
    refreshToken: refreshToken,
    accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION,
    refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION,
  };

  return authData;
};
