const { register, login } = require("./auth");
const {
  getAllPosts,
  getPostById,
  addPost,
  deletePost,
  setCreatedSince,
  getPostReactions,
  addPostReaction,
  deletePostReaction,
  addComment,
} = require("./post");

const resolvers = {
  Query: {
    posts: getAllPosts,
    post: getPostById,
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
  },

  Post: {
    created_since: setCreatedSince,
    reactions: getPostReactions,
  },

  Comment: {
    created_since: setCreatedSince,
  },
};

module.exports = resolvers;
