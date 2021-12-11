const { register, login } = require("./auth");
const {
  getAllPosts,
  getPostById,
  getPostComments,
  getChildComments,
  addPost,
  deletePost,
  setCreatedSince,
  getPostReactions,
  addPostReaction,
  deletePostReaction,
  addComment,
  addCommentReaction,
} = require("./post");

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
  },

  Post: {
    created_since: setCreatedSince,
    reactions: getPostReactions,
  },

  Comment: {
    created_since: setCreatedSince,
    child_comments: getChildComments,
  },
};

module.exports = resolvers;
