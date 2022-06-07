const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { graphqlUploadExpress } = require("graphql-upload");
const ms = require("ms");
const jwt = require("jsonwebtoken");
const pool = require("./database");
const { getFileStream } = require("./services/s3");
const { getGoogleOAuthTokens, getGoogleUser } = require("./services/oauth");
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
    const googleUser = await getGoogleUser(id_token, access_token);

    // Create or update Cirqls user with Google user
    const query = await pool.query(
      `SELECT user_id, email, username, google_id 
      FROM users 
      WHERE email = ($1)`,
      [googleUser.email]
    );

    const user = query.rows[0];

    if (!user) {
      // redirect to sign up page
      const payload = {
        email: googleUser.email,
        google_id: googleUser.id,
      };

      const token = jwt.sign(payload, process.env.OAUTH_TOKEN_SECRET, {
        expiresIn: "1d",
      });

      // TODO: change to production
      return res.redirect(`http://localhost:3000/signup/${token}?oauth=true`);
    } else if (!user.google_id) {
      // ask to link accounts
    } else if (user.google_id !== googleUser.id) {
      // send error
    }

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
    return res.redirect("http://localhost:3000/"); // TODO: change to production
  } catch (error) {
    console.error(error);
    return res.redirect("http://localhost:3000/"); // TODO: change to production
  }
});

startServer(app);
