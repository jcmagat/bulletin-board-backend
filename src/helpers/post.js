exports.formatPostReactions = (postReactions) => {
  const newPostReactions = {
    likes: 0,
    dislikes: 0,
    total: 0,
  };

  postReactions.forEach((reaction) => {
    newPostReactions[reaction.reaction.concat("s")] = parseInt(reaction.count);
  });
  newPostReactions.total = newPostReactions.likes - newPostReactions.dislikes;

  return newPostReactions;
};
