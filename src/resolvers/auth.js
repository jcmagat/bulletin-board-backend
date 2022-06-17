const pool = require("../database");
const { verifyOAuthToken } = require("../services/jwt");
const bcrypt = require("bcrypt");
const { ApolloError, UserInputError } = require("apollo-server-errors");
const { setAuthCookies } = require("../helpers/auth");

exports.signup = async (parent, args, context) => {
  const { res } = context;

  try {
    const username = args.username;
    const password = args.password;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      [username, hashedPassword]
    );

    // Set auth cookies
    setAuthCookies(res, query.rows[0].user_id);

    return { success: true };
  } catch (error) {
    if (error.constraint === "users_username_unique") {
      throw new UserInputError("Username is already taken");
    } else {
      throw new ApolloError(error);
    }
  }
};

exports.registerOAuth = async (parent, args, context) => {
  const { res } = context;

  try {
    const token = args.token;
    const username = args.username;

    const { isValid, email, google_id } = verifyOAuthToken(token);
    if (!isValid) {
      throw new ApolloError("Invalid token");
    }

    const query = await pool.query(
      "INSERT INTO users (email, username, google_id) VALUES ($1, $2, $3) RETURNING *",
      [email, username, google_id]
    );

    // Set auth cookies
    setAuthCookies(res, query.rows[0].user_id);

    return { success: true };
  } catch (error) {
    if (error.constraint === "users_email_unique") {
      throw new UserInputError("Email is already registered");
    } else if (error.constraint === "users_username_unique") {
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
      "SELECT * FROM users WHERE v_username = LOWER($1)",
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

    // Set auth cookies
    setAuthCookies(res, user.user_id);

    return { success: true };
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.logout = async (parent, args, context) => {
  const { res } = context;

  try {
    // Delete auth cookies
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return { success: true };
  } catch (error) {
    throw new ApolloError(error);
  }
};
