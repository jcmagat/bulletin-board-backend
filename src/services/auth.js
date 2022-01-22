const jwt = require("jsonwebtoken");

exports.authenticateToken = (headers) => {
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
