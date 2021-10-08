const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} = require("graphql");
const { getAllPosts, getPostById } = require("../resolvers");

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

const RootQueryType = new GraphQLObjectType({
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

module.exports = RootQueryType;
