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

    const user_id = payload.user_id;
    const query = await pool.query(
      `SELECT user_id 
      FROM users 
      WHERE user_id = ($1)`,
      [user_id]
    );

    const user = query.rows[0];
    if (!user) {
      req.isAuth = false;
      return next();
    }

    req.isAuth = true;
    req.user = payload;
    next();
  } catch (error) {
    req.isAuth = false;
    return next();
  }
};
