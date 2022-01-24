exports.formatConversations = (messages, authUserId) => {
  let conversations = [];

  for (const message of messages) {
    const id =
      message.sender_id !== authUserId
        ? message.sender_id
        : message.recipient_id;

    const index = conversations.findIndex(
      (conversation) => conversation.user_id === id
    );

    if (index > -1) {
      conversations[index].messages.push(message);
    } else {
      conversations.push({
        user_id: id,
        messages: [message],
      });
    }
  }

  return conversations;
};
