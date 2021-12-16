// Child resolver for Post and Comment to set created_since
exports.setCreatedSince = async (parent, args, { req, res }) => {
  const age = parent.age;
  if (!age) {
    return null;
  }

  const { years, days, hours, minutes } = age;
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
    return "just now";
  }

  return time + ago;
};
