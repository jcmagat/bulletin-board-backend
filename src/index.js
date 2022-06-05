const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { graphqlUploadExpress } = require("graphql-upload");
const ms = require("ms");
const { getFileStream } = require("./services/s3");
const { getGoogleOAuthTokens, getGoogleUser } = require("./services/oauth");
const { createUserWithGoogleOAuth } = require("./helpers/auth");
const { createAuthTokens } = require("./services/jwt");
const startServer = require("./apollo");

dotenv.config();

const app = express();
app.use(express.json());

// Set up CORS
const devCorsOptions = {
  origin: "*",
  credentials: true,
};

const prodCorsOptions = {
  origin: ["https://cirqls.app"],
  credentials: true,
};

const corsOptions =
  process.env.NODE_ENV === "production" ? prodCorsOptions : devCorsOptions;
app.use(cors(corsOptions));

// Cookie parser
app.use(cookieParser());

// File upload middleware
app.use(graphqlUploadExpress());

// Serve media from S3
app.get("/media/:key", (req, res) => {
  const key = req.params.key;

  const readStream = getFileStream(key).on("error", (error) => {
    res.sendStatus(404);
  });

  readStream.pipe(res);
});

// OAuth
app.get("/oauth/google", async (req, res) => {
  // Get code from query string
  const code = req.query.code;

  try {
    // Get id and access token with code
    const { id_token, access_token } = await getGoogleOAuthTokens(code);

    // Get user with token
    const { email, id } = await getGoogleUser(id_token, access_token);

    // Create or update user in db with user from google
    const user = await createUserWithGoogleOAuth(email, id);

    // TODO:
    // If email is already registered and google_id is null,
    // ask user if they want to link their existing account with
    // their google account

    // If email is already registered and google_id is different
    // (not possible afaik), send an error

    // If email is not already registered, ask user for a username
    // and create a new user

    // Create access and refresh tokens
    const payload = {
      user_id: user.user_id,
    };

    const { accessToken, refreshToken } = createAuthTokens(payload);

    // Set auth cookies
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

    // Redirect back to client
    res.redirect("http://localhost:3000/");
  } catch (error) {
    console.error(error);
    res.redirect("http://localhost:3000/");
  }
});

startServer(app);
