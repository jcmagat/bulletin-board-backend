const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { graphqlUploadExpress } = require("graphql-upload");
const { getFileStream } = require("./services/s3");
const { getGoogleOAuthTokens, getGoogleUser } = require("./services/oauth");
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

    console.log({ id_token, access_token });

    // Get user with token
    const user = await getGoogleUser(id_token, access_token);

    console.log({ user });

    // Create or update user in db with user from google

    // Check db if google user's email is registered
    // If registered, add google user's id to the user
    // If not, create a user using google user's email

    // Create access and refresh tokens

    // Set cookies

    // Redirect back to client
  } catch (error) {
    console.error("Error");
    // console.error(error);
  }

  res.send("Hello");
});

startServer(app);
