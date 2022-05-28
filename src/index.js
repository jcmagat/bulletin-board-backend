const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { graphqlUploadExpress } = require("graphql-upload");
const { authenticateToken } = require("./middlewares/auth");
const { getFileStream } = require("./services/s3");
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

// Auth middleware
app.use(authenticateToken);

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
app.get("/oauth/google", (req, res) => {
  res.send("Hello");

  // send cookie back to client
});

startServer(app);
