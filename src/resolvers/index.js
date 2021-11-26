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
  },

  Post: {
    created_since: setCreatedSince,
    reactions: getPostReactions,
  },
};

module.exports = resolvers;
