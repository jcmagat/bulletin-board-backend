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

exports.getAuthUser = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const user_id = req.user.user_id;

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
    `SELECT username, follows.created_at as followed_at 
    FROM follows
      INNER JOIN users
      ON (followed_id = user_id)
    WHERE follower_id = ($1)`,
    [user_id]
  );

  const following = query.rows;

  return following;
};

// Child resolver for User to get followers
exports.getFollowers = async (parent, args) => {
  const user_id = parent.user_id;

  const query = await pool.query(
    `SELECT username, follows.created_at as followed_at 
    FROM follows
      INNER JOIN users
      ON (follower_id = user_id)
    WHERE followed_id = ($1)`,
    [user_id]
  );

  const followers = query.rows;

  return followers;
};

// Child resolver for User to get user's posts
exports.getPostsByUser = async (parent, args) => {
  const user_id = parent.user_id;

  const query = await pool.query(
    `SELECT post_id, title, description, posts.user_id, username, 
      age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE posts.user_id = ($1)`,
    [user_id]
  );

  const posts = query.rows;

  return posts;
};

/* ========== Mutation Resolvers ========== */

exports.follow = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const follower_id = req.user.user_id;
  const followed_username = args.username;

  const query = await pool.query(
    `WITH x AS (
    INSERT INTO follows (follower_id, followed_id) 
      SELECT ($1), user_id 
      FROM users 
      WHERE username = ($2)
    )
    SELECT user_id, username, created_at 
    FROM users 
    WHERE username = ($2)`,
    [follower_id, followed_username]
  );

  const followedUser = query.rows[0];

  return followedUser;
};

exports.unfollow = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const follower_id = req.user.user_id;
  const followed_username = args.username;

  const query = await pool.query(
    `WITH x AS (
    DELETE FROM follows
    WHERE follower_id = ($1) AND followed_id IN (
      SELECT user_id
      FROM users 
      WHERE username = ($2)
    ))
    SELECT user_id, username, created_at 
    FROM users 
    WHERE username = ($2)`,
    [follower_id, followed_username]
  );

  const unfollowedUser = query.rows[0];

  return unfollowedUser;
};

exports.removeFollower = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new Error("Not authenticated");
  }

  const followed_id = req.user.user_id;
  const follower_username = args.username;

  const query = await pool.query(
    `DELETE FROM follows
    WHERE followed_id = ($1) AND follower_id IN (
      SELECT user_id
      FROM users 
      WHERE username = ($2)
    )
    RETURNING created_at as followed_at`,
    [followed_id, follower_username]
  );

  const unfollow = query.rows[0];
  unfollow.username = follower_username;

  return unfollow;
};
