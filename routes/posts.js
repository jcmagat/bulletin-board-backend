const express = require("express");
const { getPosts } = require("../controllers/posts");

const router = express.Router();

router.route("/").get(getPosts);

module.exports = router;
