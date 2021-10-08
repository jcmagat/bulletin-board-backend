const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
} = require("graphql");
const { getAllPosts, getPostById, addPost } = require("../resolvers");

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
  }),
});
