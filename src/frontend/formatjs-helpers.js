exports.format = (msgs) => {
  return Object.entries(msgs).map(([id, msg]) => ({
    id,
    defaultMessage: msg.defaultMessage,
    description: msg.description,
  }));
};

exports.compile = (msgs) => {
  return msgs.reduce((acc, message) => {
    return { ...acc, [message.id]: message.description };
  }, {});
};
