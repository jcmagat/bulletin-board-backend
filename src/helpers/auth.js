const pool = require("../database");

exports.createUserWithGoogleOAuth = async (email, google_id) => {
  const username = email.split("@")[0];

  const query = await pool.query(
    `INSERT INTO users (email, username, google_id) 
    VALUES ($1, $2, $3) 
    ON CONFLICT ON CONSTRAINT users_email_unique 
    DO UPDATE SET google_id = ($3)
    RETURNING user_id, email, username, google_id`,
    [email, username, google_id]
  );

  return query.rows[0];
};
