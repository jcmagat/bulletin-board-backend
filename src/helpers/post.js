// Sets the postedSince property of a post
exports.setPostedSince = (post) => {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  const postedOn = new Date(post.postedOn).getTime();
  const elapsed = Date.now() - postedOn;

  let time;
  let ago;

  if (elapsed < msPerMinute) {
    post.postedSince = "just now";
    return;
  } else if (elapsed < msPerHour) {
    time = Math.round(elapsed / msPerMinute);
    ago = time > 1 ? " minutes ago" : " minute ago";
  } else if (elapsed < msPerDay) {
    time = Math.round(elapsed / msPerHour);
    ago = time > 1 ? " hours ago" : " hour ago";
  } else if (elapsed < msPerMonth) {
    time = Math.round(elapsed / msPerDay);
    ago = time > 1 ? " days ago" : " day ago";
  } else if (elapsed < msPerYear) {
    time = Math.round(elapsed / msPerMonth);
    ago = time > 1 ? " months ago" : " month ago";
  } else {
    time = Math.round(elapsed / msPerYear);
    ago = time > 1 ? " years ago" : " year ago";
  }

  post.postedSince = time + ago;
};
