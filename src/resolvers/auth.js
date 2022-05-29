const pool = require("../database");
const { sendEmailVerification } = require("../services/sendgrid");
const { verifyEmailToken } = require("../services/jwt");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ms = require("ms");
const {
  ApolloError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-errors");

exports.signup = async (parent, args) => {
  try {
    const email = args.email;

    const query = await pool.query("SELECT * FROM users WHERE email = ($1)", [
      email,
    ]);

    const user = query.rows[0];
    if (user) {
      throw new UserInputError("Email is already registered");
    }

    const payload = {
      email: email,
    };

    const token = jwt.sign(payload, process.env.EMAIL_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    sendEmailVerification(email, token); // asynchronous

    return { success: true };
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.register = async (parent, args) => {
  try {
    const token = args.token;

    const verification = verifyEmailToken(token);
    if (!verification.isValid) {
      throw new ApolloError("Invalid token");
    }

    const email = verification.email;
    const username = args.username;
    const password = args.password;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = await pool.query(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING *",
      [email, username, hashedPassword]
    );

    return { success: true };
  } catch (error) {
    if (error.constraint === "users_email_key") {
      throw new UserInputError("Email is already registered");
    } else if (error.constraint === "users_username_key") {
      throw new UserInputError("Username is already taken");
    } else {
      throw new ApolloError(error);
    }
  }
};

exports.login = async (parent, args, context) => {
  const { res } = context;

  try {
    const username = args.username;
    const password = args.password;

    const query = await pool.query(
      "SELECT * FROM users WHERE username = ($1)",
      [username]
    );

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
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });

    const authData = {
      username: user.username,
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessTokenExpiration: "1h",
      refreshTokenExpiration: "7d",
    };

    // Set cookies
    res.cookie("access_token", accessToken, {
      maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
      httpOnly: true,
      sameSite: "strict",
    });

    res.cookie("refresh_token", refreshToken, {
      maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
      httpOnly: true,
      sameSite: "strict",
    });

    return authData;
  } catch (error) {
    throw new ApolloError(error);
  }
};
