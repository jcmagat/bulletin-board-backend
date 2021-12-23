const pool = require("../db");

/* ========== Query Resolvers ========== */

exports.getUser = async (parent, args) => {
  const user_id = args.user_id;

  const query = await pool.query(
    `SELECT user_id, username, created_at 
    FROM users 
    WHERE user_id = ($1)`,
    [user_id]
  );

  const user = query.rows[0];

  return user;
};

// Child resolver for User to get following
exports.getFollowing = async (parent, args) => {
  const user_id = parent.user_id;

  const query = await pool.query(
    `SELECT COUNT(*), COALESCE(ARRAY_AGG(username), '{}') as usernames 
    FROM follows
      INNER JOIN users
      ON (following_id = user_id)
    WHERE follower_id = ($1)`,
    [user_id]
  );

  const following = query.rows[0];

  return following;
};

// Child resolver for User to get followers
exports.getFollowers = async (parent, args) => {
  const user_id = parent.user_id;

  const query = await pool.query(
    `SELECT COUNT(*), COALESCE(ARRAY_AGG(username), '{}') as usernames 
    FROM follows
      INNER JOIN users
      ON (follower_id = user_id)
    WHERE following_id = ($1)`,
    [user_id]
  );

  const followers = query.rows[0];

  return followers;
};

/* ========== Query Resolvers ========== */
