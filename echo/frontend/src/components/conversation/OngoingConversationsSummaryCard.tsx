import { IconUsersGroup } from "@tabler/icons-react";
import { SummaryCard } from "../common/SummaryCard";
import { directus } from "@/lib/directus";
import { useQuery } from "@tanstack/react-query";
import { readItems } from "@directus/sdk";
import { t } from "@lingui/macro";

const TIME_INTERVAL = 1 * 60 * 1000; // 1 mins

export const OngoingConversationsSummaryCard = ({
  projectId,
}: {
  projectId: string;
}) => {
  const conversationChunksQuery = useQuery({
    queryKey: ["conversation_chunks", projectId],
    queryFn: async () => {
      const chunks = await directus.request(
        readItems("conversation_chunk", {
          filter: {
            conversation_id: {
              project_id: projectId,
            },
            timestamp: {
              // @ts-expect-error _gt is not typed
              _gt: new Date(Date.now() - TIME_INTERVAL).toISOString(), // last chunk within 5 mins
            },
          },
          fields: ["conversation_id"],
        }),
      );

      const uniqueConversations = new Set(
        chunks.map((chunk) => chunk.conversation_id),
      );

      return uniqueConversations.size;
    },
    refetchInterval: 10000,
  });

  return (
    <SummaryCard
      loading={conversationChunksQuery.isLoading}
      value={conversationChunksQuery.data ?? 0}
      icon={<IconUsersGroup size={24} />}
      label={t`Ongoing Conversations`}
    />
  );
};
