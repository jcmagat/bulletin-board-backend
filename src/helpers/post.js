exports.reformatCreatedSince = (post) => {
  const { years, days, hours, minutes } = post.created_since;

  let time;
  let ago;

  if (years) {
    time = years;
    ago = years > 1 ? " years ago" : " year ago";
  } else if (days) {
    time = days;
    ago = days > 1 ? " days ago" : " day ago";
  } else if (hours) {
    time = hours;
    ago = hours > 1 ? " hours ago" : " hour ago";
  } else if (minutes) {
    time = minutes;
    ago = minutes > 1 ? " minutes ago" : " minute ago";
  } else {
    post.created_since = "just now";
    return;
  }

  post.created_since = time + ago;
};

exports.formatPostReactions = (postReactions) => {
  const newPostReactions = {
    total: 0,
    like: 0,
    love: 0,
    laugh: 0,
    dislike: 0,
    hate: 0,
  };

  postReactions.forEach((reaction) => {
    newPostReactions.total += parseInt(reaction.count);
    newPostReactions[reaction.reaction] = parseInt(reaction.count);
  });

  return newPostReactions;
};
