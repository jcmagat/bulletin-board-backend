const express = require("express");
const cors = require("cors");
var cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { ApolloServer } = require("apollo-server-express");
const { typeDefs: scalarTypeDefs } = require("graphql-scalars");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { authenticateToken } = require("./middlewares/auth");

dotenv.config();

const app = express();
app.use(express.json());

var corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(cookieParser());

async function startServer() {
  // Apply auth middleware
  app.use(authenticateToken);

  // Start Apollo server
  const server = new ApolloServer({
    typeDefs: [...scalarTypeDefs, typeDefs],
    resolvers,
    context: ({ req, res }) => ({ req, res }),
  });

  await server.start();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`Listening on port ${port}...`));
}

startServer();
