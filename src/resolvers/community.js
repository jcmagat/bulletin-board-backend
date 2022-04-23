const pool = require("../database");
const { uploadFile, deleteFile } = require("../services/s3");
const {
  ApolloError,
  AuthenticationError,
  ForbiddenError,
  UserInputError,
} = require("apollo-server-express");

/* ========== Query Resolvers ========== */

exports.getAllCommunities = async (parent, args) => {
  try {
    const query = await pool.query(
      `SELECT community_id, name, title, description, created_at, logo_src 
      FROM communities`
    );

    const communities = query.rows;

    return communities;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.getCommunity = async (parent, args) => {
  try {
    const name = args.name;

    const query = await pool.query(
      `SELECT community_id, name, title, description, created_at, logo_src 
      FROM communities 
      WHERE name = ($1)`,
      [name]
    );

    const community = query.rows[0];

    return community;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Community to get community's moderators
exports.getCommunityModerators = async (parent, args) => {
  try {
    const community_id = parent.community_id;

    const query = await pool.query(
      `SELECT user_id, username, created_at, profile_pic_src 
      FROM users 
      WHERE user_id IN (
        SELECT user_id 
        FROM members 
        WHERE community_id = ($1) AND type = 'moderator'
      )`,
      [community_id]
    );

    const moderators = query.rows;

    return moderators;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Community to get community's members
exports.getCommunityMembers = async (parent, args) => {
  try {
    const community_id = parent.community_id;

    const query = await pool.query(
      `SELECT user_id, username, created_at, profile_pic_src 
      FROM users 
      WHERE user_id IN (
        SELECT user_id 
        FROM members 
        WHERE community_id = ($1)
      )`,
      [community_id]
    );

    const members = query.rows;

    return members;
  } catch (error) {
    throw new ApolloError(error);
  }
};

// Child resolver for Community to get community's posts
exports.getCommunityPosts = async (parent, args) => {
  try {
    const community_id = parent.community_id;

    const query = await pool.query(
      `SELECT type, post_id, title, description, media_src, created_at, 
        user_id, community_id, age(now(), created_at) 
      FROM posts 
      WHERE community_id = ($1)`,
      [community_id]
    );

    const posts = query.rows;

    return posts;
  } catch (error) {
    throw new ApolloError(error);
  }
};

/* ========== Mutation Resolvers ========== */

exports.join = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const community_id = args.community_id;
    const user_id = req.user.user_id;

    const query = await pool.query(
      `WITH x AS (
        INSERT INTO members (community_id, user_id) 
        VALUES ($1, $2) 
        ON CONFLICT ON CONSTRAINT members_pkey 
        DO NOTHING
      )
      SELECT community_id, name, title, description, created_at, logo_src 
      FROM communities 
      WHERE community_id = ($1)`,
      [community_id, user_id]
    );

    const community = query.rows[0];

    return community;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.leave = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const community_id = args.community_id;
    const user_id = req.user.user_id;

    const query = await pool.query(
      `WITH x AS (
        DELETE FROM members 
        WHERE community_id = ($1) AND user_id = ($2)
      )
      SELECT community_id, name, title, description, created_at, logo_src 
      FROM communities 
      WHERE community_id = ($1)`,
      [community_id, user_id]
    );

    const community = query.rows[0];

    return community;
  } catch (error) {
    throw new ApolloError(error);
  }
};

exports.createCommunity = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const user_id = req.user.user_id;
    const name = args.name;
    const title = args.title;
    const description = args.description;
    const type = args.type;
    const logo = args.logo;
    let logo_src = null;

    if (logo) {
      const uploadedFile = await uploadFile(logo);
      logo_src = `/media/${uploadedFile.Key}`;
    }

    const query = await pool.query(
      `WITH 
        new_community AS (
          INSERT INTO communities (name, title, description, type, logo_src) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING community_id, name, title, description, created_at, logo_src
        ), 
        new_moderator AS (
          INSERT INTO members (community_id, user_id, type) 
          VALUES (
            (SELECT community_id FROM new_community), 
            $6, 'moderator') 
        )
      SELECT * 
      FROM new_community`,
      [name, title, description, type, logo_src, user_id]
    );

    const community = query.rows[0];

    return community;
  } catch (error) {
    if (error.constraint === "communities_name_unique") {
      throw new UserInputError("Community name is already taken");
    } else {
      throw new ApolloError(error);
    }
  }
};

exports.editCommunity = async (parent, args, { req, res }) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }

  try {
    const community_id = args.community_id;
    const user_id = req.user.user_id;
    const title = args.title;
    const description = args.description;
    const type = args.type;
    const logo = args.logo;

    const moderatorQuery = await pool.query(
      `SELECT * 
      FROM members 
      WHERE community_id = ($1) AND user_id = ($2) AND type = 'moderator'`,
      [community_id, user_id]
    );

    if (!moderatorQuery.rows[0]) {
      throw new ForbiddenError("User not authorized to edit this community");
    }

    if (title) {
      await pool.query(
        `UPDATE communities 
        SET title = ($1) 
        WHERE community_id = ($2)`,
        [title, community_id]
      );
    }

    if (description) {
      await pool.query(
        `UPDATE communities 
        SET description = ($1) 
        WHERE community_id = ($2)`,
        [description, community_id]
      );
    }

    if (type) {
      await pool.query(
        `UPDATE communities 
        SET type = ($1) 
        WHERE community_id = ($2)`,
        [type, community_id]
      );
    }

    if (logo) {
      const uploadedFile = await uploadFile(logo);
      const logo_src = `/media/${uploadedFile.Key}`;

      const logoQuery = await pool.query(
        `UPDATE communities
        SET logo_src = ($1)
        WHERE community_id = ($2) 
        RETURNING (
            SELECT logo_src 
            FROM communities 
            WHERE community_id = ($2)
          ) AS old_logo_src`,
        [logo_src, community_id]
      );

      const old_logo_src = logoQuery.rows[0].old_logo_src;
      if (old_logo_src) {
        const key = old_logo_src.split("/")[2];
        await deleteFile(key);
      }
    }

    const communityQuery = await pool.query(
      `SELECT community_id, name, title, description, created_at, logo_src 
      FROM communities 
      WHERE community_id = ($1)`,
      [community_id]
    );

    const community = communityQuery.rows[0];

    return community;
  } catch (error) {
    throw new ApolloError(error);
  }
};
