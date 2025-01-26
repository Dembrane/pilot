import { t } from "@lingui/core/macro";
import { useProjectChatContext } from "@/lib/query";
import { capitalize } from "@/lib/utils";
import { Box, Progress, Skeleton, Tooltip } from "@mantine/core";

export const ChatContextProgress = ({ chatId }: { chatId: string }) => {
  const chatContextQuery = useProjectChatContext(chatId);

  if (chatContextQuery.isLoading) {
    return (
      <Skeleton
        height={8}
        style={{
          width: "100%",
        }}
      />
    );
  }

  const conversationsAlreadyAdded = chatContextQuery.data?.conversations
    .filter((c) => c.locked)
    .sort((a, b) => b.token_usage - a.token_usage);

  const conversationsToBeAdded = chatContextQuery.data?.conversations
    .filter((c) => !c.locked)
    .sort((a, b) => b.token_usage - a.token_usage);

  return (
    <Box>
      <Progress.Root size={8}>
        {conversationsAlreadyAdded?.map((m, idx) => (
          <Tooltip
            key={idx}
            label={`${m.conversation_participant_name} - ${Math.ceil(
              m.token_usage * 100,
            )}%`}
          >
            <Progress.Section
              value={m.token_usage * 100}
              color="blue.6"
              mr="1px"
            />
          </Tooltip>
        ))}

        {conversationsToBeAdded?.map((m, idx) => (
          <Tooltip
            key={idx}
            label={`${m.conversation_participant_name} - ${Math.ceil(
              m.token_usage * 100,
            )}%`}
          >
            <Progress.Section
              value={m.token_usage * 100}
              color="blue.3"
              mr="1px"
            />
          </Tooltip>
        ))}

        {chatContextQuery.data?.messages.map((m, idx) => (
          <Tooltip
            key={idx}
            label={t`Messages from ${capitalize(m.role)} - ${Math.ceil(m.token_usage * 100)}%`}
          >
            <Progress.Section value={m.token_usage * 100} color="gray.5" />
          </Tooltip>
        ))}
      </Progress.Root>
    </Box>
  );
};
