const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLList,
} = require("graphql");
const PostsResolver = require("../resolvers");

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
      resolve: PostsResolver,
    },
  }),
});

module.exports = RootQueryType;
