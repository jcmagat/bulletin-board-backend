const jwt = require("jsonwebtoken");
const pool = require("../database");

exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }

  const token = authHeader.split(" ")[1]; // Authorization: Bearer token
  if (!token) {
    req.isAuth = false;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = {
      user_id: payload.user_id,
    };

    req.isAuth = true;
    req.user = user;
    next();
  } catch (error) {
    req.isAuth = false;
    return next();
  }
};
