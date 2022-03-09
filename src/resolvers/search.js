const pool = require("../database");
const { ApolloError } = require("apollo-server-errors");

/* ========== Query Resolvers ========== */

exports.search = async (parent, args) => {
  try {
    const term = args.term;

    const postQuery = await pool.query(
      `SELECT type, post_id, title, description, media_src, created_at, 
        user_id, community_id, age(now(), created_at) 
      FROM posts 
      WHERE to_tsvector(title || ' ' || COALESCE(description, '')) 
        @@ to_tsquery($1)`,
      [term]
    );

    const userQuery = await pool.query(
      `SELECT user_id, username, created_at, profile_pic_src 
      FROM users 
      WHERE to_tsvector(username) @@ to_tsquery($1)`,
      [term]
    );

    const communityQuery = await pool.query(
      `SELECT community_id, name, title, description, created_at, logo_src 
      FROM communities 
      WHERE to_tsvector(name || ' ' || title || ' ' || description) 
        @@ to_tsquery($1)`,
      [term]
    );

    const results = [
      ...postQuery.rows,
      ...userQuery.rows,
      ...communityQuery.rows,
    ];

    return results;
  } catch (error) {
    throw new ApolloError(error);
  }
};
