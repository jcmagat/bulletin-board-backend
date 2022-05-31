const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { graphqlUploadExpress } = require("graphql-upload");
const { getFileStream } = require("./services/s3");
const { getGoogleOAuthTokens } = require("./services/oauth");
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

  // Get id and access token with code
  try {
    const { id_token, access_token } = await getGoogleOAuthTokens(code);
    console.log("Success");
    // console.log(id_token);
    // console.log(access_token);
  } catch (error) {
    console.error("Error");
    // console.error(error);
  }

  // Get user with token

  // Upsert the user

  // Create a session

  // Create access and refresh tokens

  // Set cookies

  // Redirect back to client

  res.send("Hello");
});

startServer(app);
