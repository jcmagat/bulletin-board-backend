const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello world!");
});

const postsRoute = require("./routes/posts");
app.use("/api/v1/posts", postsRoute);

app.listen(5000, () => console.log("Listening on port 5000..."));
