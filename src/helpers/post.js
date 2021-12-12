exports.formatReactions = (reactions) => {
  const formattedReactions = {
    likes: 0,
    dislikes: 0,
    total: 0,
  };

  reactions.forEach((reaction) => {
    formattedReactions[reaction.reaction.concat("s")] = parseInt(
      reaction.count
    );
  });
  formattedReactions.total =
    formattedReactions.likes - formattedReactions.dislikes;

  return formattedReactions;
};
