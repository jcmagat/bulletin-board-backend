const pool = require("../db");

/* ========== Query Resolvers ========== */

exports.getCommunity = async (parent, args) => {
  const community_id = args.community_id;

  const query = await pool.query(
    `SELECT community_id, name, title, description, created_at 
    FROM communities 
    WHERE community_id = ($1)`,
    [community_id]
  );

  const community = query.rows[0];

  return community;
};

// Child resolver for Community to get community's posts
exports.getCommunityPosts = async (parent, args) => {
  const community_id = parent.community_id;

  const query = await pool.query(
    `SELECT post_id, title, description, posts.user_id, username, 
      community_id, age(now(), posts.created_at) 
    FROM posts 
      INNER JOIN users 
      ON (posts.user_id = users.user_id)
    WHERE community_id = ($1)`,
    [community_id]
  );

  const posts = query.rows;

  return posts;
};

/* ========== Mutation Resolvers ========== */
