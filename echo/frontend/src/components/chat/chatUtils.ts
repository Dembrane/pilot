import { formatDate } from "date-fns";

export const formatMessage = (
  message: ChatHistory[number],
  userName: string = "User",
  assistantName: string = "Dembrane",
) => {
  const date = formatDate(
    new Date(message._original.date_created ?? new Date()),
    "MMM d yy, h:mm:ss a",
  );

  if (!["user", "dembrane"].includes(message.role)) {
    return ``;
  }

  return `*${message.role === "user" ? userName : assistantName} at ${date}:*\n\n${message.content}\n\n\n\n---`;
};
