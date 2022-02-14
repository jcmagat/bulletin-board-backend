const pool = require("../database");
const {
  getHomePagePostsForAuthUser,
  getPostsForNonAuthUser,
} = require("../helpers/post");
const { formatReactions } = require("../helpers/common");
const { uploadFile, deleteFile } = require("../services/s3");
const {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
} = require("apollo-server-errors");

const POST_TYPES = {
  TEXT_POST: "TextPost",
  MEDIA_POST: "MediaPost",
};

/* ========== Query Resolvers ========== */

exports.getHomePagePosts = async (parent, args, { req, res }) => {
  try {
    let posts;

    if (req.isAuth) {
      const user_id = req.user.user_id;
      posts = await getHomePagePostsForAuthUser(user_id);
    } else {
      posts = await getPostsForNonAuthUser();
    }

    return posts;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.getExplorePagePosts = async (parent, args, { req, res }) => {
  try {
    const posts = await getPostsForNonAuthUser();

    return posts;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.getPostById = async (parent, args) => {
  try {
    const post_id = args.post_id;

    const query = await pool.query(
      `SELECT type, post_id, title, description, media_src, created_at, 
        user_id, community_id, age(now(), created_at) 
      FROM posts 
      WHERE post_id = ($1)`,
      [post_id]
    );

    const post = query.rows[0];

    return post;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Post to get the community that the post is in
exports.getPostCommunity = async (parent, args) => {
  try {
    const community_id = parent.community_id;

    const query = await pool.query(
      `SELECT community_id, name, title, description, created_at 
      FROM communities 
      WHERE community_id = ($1)`,
      [community_id]
    );

    const community = query.rows[0];

    return community;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Post to get info on comments
exports.getPostCommentsInfo = async (parent, args) => {
  try {
    const post_id = parent.post_id;

    const query = await pool.query(
      `SELECT COALESCE(ARRAY_AGG(comment_id), '{}') AS comment_ids, COUNT(*) AS total
      FROM comments 
      WHERE post_id = ($1)`,
      [post_id]
    );

    const commentsInfo = query.rows[0];

    return commentsInfo;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Post to get post reactions
exports.getPostReactions = async (parent, args, { req, res }) => {
  try {
    const post_id = parent.post_id;

    const query = await pool.query(
      `SELECT reaction, COUNT(*) 
      FROM post_reactions 
      WHERE post_id = ($1) 
      GROUP BY reaction`,
      [post_id]
    );

    let postReactions = formatReactions(query.rows);

    if (req.isAuth) {
      const user_id = req.user.user_id;

      const auth_query = await pool.query(
        `SELECT reaction as auth_user_reaction
        FROM post_reactions
        WHERE post_id = ($1) AND user_id = ($2)`,
        [post_id, user_id]
      );

      postReactions = { ...postReactions, ...auth_query.rows[0] };
    }

    return postReactions;
  } catch (error) {
    throw new ApolloError(error);
  }
};

/* ========== Mutation Resolvers ========== */

exports.addTextPost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const type = POST_TYPES.TEXT_POST;
    const title = args.title;
    const description = args.description;
    const user_id = req.user.user_id;
    const community_id = args.community_id;

    const query = await pool.query(
      `INSERT INTO posts (type, title, description, user_id, community_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING type, post_id, title, description, created_at, user_id, 
        community_id, age(now(), created_at)`,
      [type, title, description, user_id, community_id]
    );

    const newPost = query.rows[0];

    return newPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.addMediaPost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const type = POST_TYPES.MEDIA_POST;
    const title = args.title;
    const user_id = req.user.user_id;
    const community_id = args.community_id;

    const uploadedMedia = await uploadFile(args.media);
    const media_src = `/media/${uploadedMedia.Key}`;

    const query = await pool.query(
      `INSERT INTO posts (type, title, media_src, user_id, community_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING type, post_id, title, media_src, created_at, user_id, 
        community_id, age(now(), created_at)`,
      [type, title, media_src, user_id, community_id]
    );

    const newPost = query.rows[0];

    return newPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.deletePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const post_id = args.post_id;
    const user_id = req.user.user_id;

    const query = await pool.query(
      `DELETE FROM posts 
      WHERE post_id = ($1) AND user_id = ($2) 
      RETURNING type, post_id, title, description, media_src, created_at, 
        user_id, community_id, age(now(), created_at)`,
      [post_id, user_id]
    );

    const deletedPost = query.rows[0];
    if (!deletedPost) {
      throw new ForbiddenError("User not authorized to delete this post");
    }

    if (deletedPost.type === POST_TYPES.MEDIA_POST) {
      const key = deletedPost.media_src.split("/")[2];
      await deleteFile(key);
    }

    return deletedPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.addPostReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const post_id = args.post_id;
    const user_id = req.user.user_id;
    const reaction = args.reaction;

    const query = await pool.query(
      `WITH x AS (
        INSERT INTO post_reactions (post_id, user_id, reaction) 
        VALUES ($1, $2, $3) 
        ON CONFLICT ON CONSTRAINT post_reactions_pkey
        DO UPDATE SET reaction = ($3)
      )
      SELECT type, post_id, title, description, media_src, created_at, 
        user_id, community_id, age(now(), created_at) 
      FROM posts 
      WHERE post_id = ($1)`,
      [post_id, user_id, reaction]
    );

    const post = query.rows[0];

    return post;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.deletePostReaction = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const post_id = args.post_id;
    const user_id = req.user.user_id;

    const query = await pool.query(
      `WITH x AS (
        DELETE FROM post_reactions 
        WHERE post_id = ($1) AND user_id = ($2) 
      )
      SELECT type, post_id, title, description, media_src, created_at, 
        user_id, community_id, age(now(), created_at) 
      FROM posts 
      WHERE post_id = ($1)`,
      [post_id, user_id]
    );

    const post = query.rows[0];

    return post;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.savePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const user_id = req.user.user_id;
    const post_id = args.post_id;

    const query = await pool.query(
      `WITH x AS (
        INSERT INTO saved_posts (user_id, post_id) 
        VALUES ($1, $2) 
      )
      SELECT type, post_id, title, description, media_src, created_at, 
        user_id, community_id, age(now(), created_at) 
      FROM posts 
      WHERE post_id = ($2)`,
      [user_id, post_id]
    );

    const savedPost = query.rows[0];

    return savedPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.unsavePost = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const user_id = req.user.user_id;
    const post_id = args.post_id;

    const query = await pool.query(
      `WITH x AS (
        DELETE FROM saved_posts 
        WHERE user_id = ($1) AND post_id = ($2) 
      )
      SELECT type, post_id, title, description, media_src, created_at, 
        user_id, community_id, age(now(), created_at) 
      FROM posts 
      WHERE post_id = ($2)`,
      [user_id, post_id]
    );

    const unsavedPost = query.rows[0];

    return unsavedPost;
  } catch (error) {
    throw new ApolloError(error);
  }
};
