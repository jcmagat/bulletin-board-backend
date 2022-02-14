const pool = require("../database");

exports.getHomePagePostsForAuthUser = async (user_id) => {
  const query = await pool.query(
    `SELECT type, post_id, title, description, media_src, created_at, 
      user_id, community_id, age(now(), created_at) 
    FROM posts 
    WHERE community_id IN (
      SELECT community_id 
      FROM members 
      WHERE user_id = ($1)
    )
    ORDER BY created_at DESC`,
    [user_id]
  );

  const posts = query.rows;

  return posts;
};

exports.getPostsForNonAuthUser = async () => {
  const query = await pool.query(
    `SELECT type, post_id, title, description, media_src, created_at, 
      user_id, community_id, age(now(), created_at) 
    FROM posts 
    ORDER BY created_at DESC`
  );

  const posts = query.rows;

  return posts;
};
