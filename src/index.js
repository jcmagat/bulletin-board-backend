const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { graphqlUploadExpress } = require("graphql-upload");
const jwt = require("jsonwebtoken");
const pool = require("./database");
const { getFileStream } = require("./services/s3");
const { getGoogleOAuthTokens, getGoogleUser } = require("./services/oauth");
const { setAuthCookies } = require("./helpers/auth");
const startServer = require("./apollo");

dotenv.config();

const app = express();
app.use(express.json());

const frontendUri = process.env.FRONTEND_URI;

const corsOptions = {
  origin: [frontendUri],
  credentials: true,
};

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
      // Register a new user
      const payload = {
        email: googleUser.email,
        google_id: googleUser.id,
      };

      const token = jwt.sign(payload, process.env.OAUTH_TOKEN_SECRET, {
        expiresIn: "1d",
      });

      // Redirect to sign up page
      return res.redirect(`${frontendUri}/signup/${token}?oauth=true`);
    } else if (!user.google_id) {
      // Ask to link accounts
      return res.redirect(`${frontendUri}/link-account/google`);
    } else if (user.google_id !== googleUser.id) {
      // Send error
      // TODO: change
      return res.redirect(`${frontendUri}/link-account/google`);
    }

    // Redirect back to client
    res.redirect(frontendUri);

    // Set auth cookies
    setAuthCookies(res, user.user_id);
  } catch (error) {
    console.error(error);
    res.redirect(frontendUri);
  }
});

startServer(app);
