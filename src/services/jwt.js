const jwt = require("jsonwebtoken");

exports.createAuthTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
};

exports.verifyAuthToken = (token) => {
  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const authUser = {
      user_id: payload.user_id,
    };

    return { isAuthenticated: true, authUser: authUser };
  } catch (error) {
    return { isAuthenticated: false };
  }
};

exports.verifyEmailToken = (token) => {
  if (!token) {
    return { isValid: false };
  }

  try {
    const payload = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);

    return { isValid: true, email: payload.email };
  } catch (error) {
    return { isValid: false };
  }
};

exports.verifyDeleteAccountToken = (token) => {
  if (!token) {
    return { isValid: false };
  }

  try {
    const payload = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);

    return { isValid: true, user_id: payload.user_id };
  } catch (error) {
    return { isValid: false };
  }
};

exports.verifyOAuthToken = (token) => {
  if (!token) {
    return { isValid: false };
  }

  try {
    const payload = jwt.verify(token, process.env.OAUTH_TOKEN_SECRET);

    return {
      isValid: true,
      email: payload.email,
      google_id: payload.google_id,
    };
  } catch (error) {
    return { isValid: false };
  }
};
