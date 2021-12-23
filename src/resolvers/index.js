const { register, login } = require("./auth");
const { getUser, getFollowing, getFollowers } = require("./user");
const {
  getAllPosts,
  getPostById,
  getPostCommentsInfo,
  getPostReactions,
  addPost,
  deletePost,
  addPostReaction,
  deletePostReaction,
} = require("./post");
const {
  getPostComments,
  getChildComments,
  getCommentReactions,
  addComment,
  deleteComment,
  addCommentReaction,
  deleteCommentReaction,
} = require("./comment");
const { setCreatedSince } = require("./common");

const resolvers = {
  Query: {
    user: getUser,
    posts: getAllPosts,
    post: getPostById,
    comments: getPostComments,
  },

  Mutation: {
    // Auth mutations
    register: register,
    login: login,

    // Post mutations
    addPost: addPost,
    deletePost: deletePost,
    addPostReaction: addPostReaction,
    deletePostReaction: deletePostReaction,

    // Comment mutations
    addComment: addComment,
    deleteComment: deleteComment,
    addCommentReaction: addCommentReaction,
    deleteCommentReaction: deleteCommentReaction,
  },

  User: {
    following: getFollowing,
    followers: getFollowers,
  },

  Post: {
    created_since: setCreatedSince,
    reactions: getPostReactions,
    comments_info: getPostCommentsInfo,
  },

  Comment: {
    created_since: setCreatedSince,
    reactions: getCommentReactions,
    child_comments: getChildComments,
  },
};

module.exports = resolvers;
