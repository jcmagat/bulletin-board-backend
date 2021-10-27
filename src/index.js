const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { authenticateToken } = require("./middlewares/auth");

const app = express();
app.use(express.json());

var corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

dotenv.config({ path: "src/.env" });

async function startServer() {
  // Connect to database
  mongoose
    .connect(process.env.DB_CONNECTION, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    .then(() => console.log("DB Connected!"))
    .catch((err) => {
      console.log(`DB Connection Error: ${err.message}`);
    });

  // Apply auth middleware
  app.use(authenticateToken);

  // Start Apollo server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => ({ req, res }),
  });

  await server.start();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`Listening on port ${port}...`));
}

startServer();
