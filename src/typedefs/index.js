const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Register {
    registered: Boolean!
  }

  type AuthData {
    username: String!
    accessToken: String!
    refreshToken: String!
    accessTokenExpiration: String!
    refreshTokenExpiration: String!
  }

  type Post {
    id: ID!
    title: String!
    message: String!
    postedOn: String!
    postedSince: String
    postedBy: String!
    likes: Int!
  }

  # Queries
  type Query {
    posts: [Post]
    post(id: ID!): Post
  }

  # Mutations
  type Mutation {
    # Auth mutations
    register(email: String!, username: String!, password: String!): Register
    login(username: String!, password: String!): AuthData

    # Post mutations
    addPost(title: String!, message: String!): Post
    deletePost(id: ID!): Post
    likePost(id: ID!): Post
    unlikePost(id: ID!): Post
  }
`;

module.exports = typeDefs;
