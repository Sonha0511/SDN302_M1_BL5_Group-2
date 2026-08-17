const logMessageDebug = (event, message) => {
  if (!message) return;

  const messageId = message._id?.toString?.() || message.id || "unknown";
  const conversationId =
    message.conversationId?._id?.toString?.() ||
    message.conversationId?.toString?.() ||
    "unknown";
  const senderId =
    message.senderId?._id?.toString?.() ||
    message.senderId?.toString?.() ||
    "unknown";

  console.log(
    `[${new Date().toISOString()}] chat:${event} messageId=${messageId} conversationId=${conversationId} senderId=${senderId}`,
  );
};

module.exports = logMessageDebug;
