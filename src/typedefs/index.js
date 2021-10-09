const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require("graphql");
const {
  getAllPosts,
  getPostById,
  addPost,
  deletePost,
  likePost,
} = require("../resolvers");
const { login } = require("../resolvers/auth");

const PostType = new GraphQLObjectType({
  name: "Post",
  fields: () => ({
    _id: { type: GraphQLString },
    title: { type: GraphQLString },
    message: { type: GraphQLString },
    postedOn: { type: GraphQLString },
    postedBy: { type: GraphQLString },
    likes: { type: GraphQLInt },
  }),
});

const AuthData = new GraphQLObjectType({
  name: "AuthData",
  fields: () => ({
    username: { type: GraphQLString },
    accessToken: { type: GraphQLString },
    tokenExpiration: { type: GraphQLInt },
  }),
});

exports.RootQueryType = new GraphQLObjectType({
  name: "RootQueryType",
  fields: () => ({
    posts: {
      type: new GraphQLList(PostType),
      resolve: getAllPosts,
    },
    post: {
      type: PostType,
      args: {
        id: { type: GraphQLString },
      },
      resolve: getPostById,
    },
  }),
});

exports.RootMutationType = new GraphQLObjectType({
  name: "RootMutationType",
  fields: () => ({
    addPost: {
      type: PostType,
      args: {
        title: { type: GraphQLNonNull(GraphQLString) },
        message: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: addPost,
    },
    deletePost: {
      type: PostType,
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: deletePost,
    },
    likePost: {
      type: PostType,
      args: {
        id: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: likePost,
    },
    login: {
      type: AuthData,
      args: {
        username: { type: GraphQLNonNull(GraphQLString) },
        password: { type: GraphQLNonNull(GraphQLString) },
      },
      resolve: login,
    },
  }),
});
