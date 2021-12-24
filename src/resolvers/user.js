const pool = require("../db");

/* ========== Query Resolvers ========== */

exports.getUser = async (parent, args) => {
  const username = args.username;

  const query = await pool.query(
    `SELECT user_id, username, created_at 
    FROM users 
    WHERE username = ($1)`,
    [username]
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
      ON (followed_id = user_id)
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
    WHERE followed_id = ($1)`,
    [user_id]
  );

  const followers = query.rows[0];

  return followers;
};

/* ========== Query Resolvers ========== */
exports.follow = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const follower_id = req.user.user_id;
  const followed_username = args.username;

  const query = await pool.query(
    `INSERT INTO follows (follower_id, followed_id) 
      SELECT ($1), user_id 
      FROM users 
      WHERE username = ($2)
    RETURNING *`,
    [follower_id, followed_username]
  );

  const follow = query.rows[0];

  return follow;
};

exports.unfollow = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const follower_id = req.user.user_id;
  const followed_username = args.username;

  const query = await pool.query(
    `DELETE FROM follows
    WHERE follower_id = ($1) AND followed_id IN (
      SELECT user_id
      FROM users 
      WHERE username = ($2)
    )
    RETURNING *`,
    [follower_id, followed_username]
  );

  const unfollow = query.rows[0];

  return unfollow;
};
