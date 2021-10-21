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
    postedBy: String!
    likes: Int!
  }

  # Queries
  type Query {
    posts: [Post]
    post(id: String!): Post
  }

  # Mutations
  type Mutation {
    # Auth mutations
    register(username: String!, password: String!): Register
    login(username: String!, password: String!): AuthData

    # Post mutations
    addPost(title: String!, message: String!): Post
    deletePost(id: String!): Post
    likePost(id: String!): Post
  }
`;

module.exports = typeDefs;
