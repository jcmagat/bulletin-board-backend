exports.getPosts = async (req, res, next) => {
  try {
    return res.status(200).json({
      data: "Hello world!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
