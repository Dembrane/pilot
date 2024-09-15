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

  const conversationsAlreadyAddedTokenUsage = conversationsAlreadyAdded?.reduce(
    (acc, c) => acc + c.token_usage * 100,
    0,
  );

  const conversationsToBeAdded = chatContextQuery.data?.conversations
    .filter((c) => !c.locked)
    .sort((a, b) => b.token_usage - a.token_usage);

  const conversationsToBeAddedTokenUsage = conversationsToBeAdded?.reduce(
    (acc, c) => acc + c.token_usage * 100,
    0,
  );

  return (
    <Box>
      <Progress.Root size={8}>
        <Tooltip
          label={
            <>
              Conversations already added (
              {conversationsAlreadyAddedTokenUsage?.toFixed(0)}%)
              {conversationsAlreadyAdded?.map((c) => (
                <div key={c.conversation_id}>
                  {c.conversation_participant_name} -{" "}
                  {(c.token_usage * 100).toFixed(0)}%
                </div>
              ))}
            </>
          }
          withArrow
        >
          <Progress.Section
            value={conversationsAlreadyAddedTokenUsage || 0}
            color="blue.6"
            mr="1px"
          />
        </Tooltip>
        <Tooltip
          label={
            <>
              Conversations to be added (
              {conversationsToBeAddedTokenUsage?.toFixed(0)}%)
              {conversationsToBeAdded?.map((c) => (
                <div key={c.conversation_id}>
                  {c.conversation_participant_name} -{" "}
                  {(c.token_usage * 100).toFixed(0)}%
                </div>
              ))}
            </>
          }
          withArrow
        >
          <Progress.Section
            value={conversationsToBeAddedTokenUsage || 0}
            color="blue.3"
          />
        </Tooltip>

        {chatContextQuery.data?.messages.map((m) => (
          <Tooltip
            label={`Messages from ${capitalize(m.role)} - ${Math.ceil(m.token_usage * 100)}%`}
          >
            <Progress.Section value={m.token_usage * 100} color="gray.5" />
          </Tooltip>
        ))}
      </Progress.Root>
    </Box>
  );
};
