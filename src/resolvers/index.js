const { register, login } = require("./auth");
const {
  getUser,
  getAuthUser,
  getFollowing,
  getFollowers,
  getPostsByUser,
  getSavedPosts,
  follow,
  unfollow,
  removeFollower,
} = require("./user");
const {
  getAllPosts,
  getPostById,
  getPostCommentsInfo,
  getPostReactions,
  addPost,
  deletePost,
  addPostReaction,
  deletePostReaction,
  savePost,
  unsavePost,
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
    // User queries
    user: getUser,
    authUser: getAuthUser,

    // Post queries
    posts: getAllPosts,
    post: getPostById,

    // Comment queries
    comments: getPostComments,
  },

  Mutation: {
    // Auth mutations
    register: register,
    login: login,

    // User mutations
    follow: follow,
    unfollow: unfollow,
    removeFollower: removeFollower,

    // Post mutations
    addPost: addPost,
    deletePost: deletePost,
    addPostReaction: addPostReaction,
    deletePostReaction: deletePostReaction,
    savePost: savePost,
    unsavePost: unsavePost,

    // Comment mutations
    addComment: addComment,
    deleteComment: deleteComment,
    addCommentReaction: addCommentReaction,
    deleteCommentReaction: deleteCommentReaction,
  },

  User: {
    following: getFollowing,
    followers: getFollowers,
    posts: getPostsByUser,
    saved_posts: getSavedPosts,
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
