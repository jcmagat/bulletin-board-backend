const qs = require("qs");
const axios = require("axios").default;

exports.getGoogleOAuthTokens = async (code) => {
  const url = "https://oauth2.googleapis.com/token";

  const params = {
    code: code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  };

  const response = await axios.post(url, qs.stringify(params), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

exports.getGoogleUser = async (id_token, access_token) => {
  const url = "https://www.googleapis.com/oauth2/v2/userinfo";

  const response = await axios.get(url, {
    params: {
      access_token: access_token,
    },
    headers: {
      Authorization: `Bearer ${id_token}`,
    },
  });

  return response.data;
};
