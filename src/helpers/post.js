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

// Returns boolean whether or not user is authorized to post in community
exports.authorizeUserPost = async (community_id, user_id) => {
  const query = await pool.query(
    `WITH 
      community AS (
        SELECT type AS community_type 
        FROM communities 
        WHERE community_id = ($1)
      ), 
      member AS (
        SELECT type AS member_type 
        FROM members 
        WHERE community_id = ($1) AND user_id = ($2)
      )
    SELECT (SELECT * FROM community), (SELECT * FROM member)`,
    [community_id, user_id]
  );

  const info = query.rows[0];

  switch (info.community_type) {
    case "public":
      return true;

    case "restricted":
      if (info.member_type === "moderator") {
        return true;
      } else {
        return false;
      }

    case "private":
      if (info.member_type === "member" || info.member_type === "moderator") {
        return true;
      } else {
        return false;
      }

    default:
      return false;
  }
};
