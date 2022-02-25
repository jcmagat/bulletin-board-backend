const jwt = require("jsonwebtoken");

exports.verifyAuthToken = (headers) => {
  const authorization = headers.authorization;
  if (!authorization) {
    return { isAuthenticated: false };
  }

  const token = authorization.split(" ")[1]; // Authorization: Bearer token
  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const authUser = {
      user_id: payload.user_id,
      username: payload.username,
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
