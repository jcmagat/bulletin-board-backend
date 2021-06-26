const express = require("express");
const { getPosts, addPost } = require("../controllers/posts");

const router = express.Router();

router.route("/").get(getPosts).post(addPost);

module.exports = router;
