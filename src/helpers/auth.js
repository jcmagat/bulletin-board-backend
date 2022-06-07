const { createAuthTokens } = require("../services/jwt");
const ms = require("ms");

exports.setAuthCookies = (res, user_id) => {
  const { accessToken, refreshToken } = createAuthTokens(user_id);

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
};
