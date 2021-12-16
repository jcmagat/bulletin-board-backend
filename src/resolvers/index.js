const { register, login } = require("./auth");
const {
  getAllPosts,
  getPostById,
  getPostCommentsInfo,
  addPost,
  deletePost,
  getPostReactions,
  addPostReaction,
  deletePostReaction,
} = require("./post");
const {
  getPostComments,
  getChildComments,
  addComment,
  getCommentReactions,
  addCommentReaction,
  deleteCommentReaction,
} = require("./comment");
const { setCreatedSince } = require("./common");

const resolvers = {
  Query: {
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

    addComment: addComment,
    addCommentReaction: addCommentReaction,
    deleteCommentReaction: deleteCommentReaction,
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
