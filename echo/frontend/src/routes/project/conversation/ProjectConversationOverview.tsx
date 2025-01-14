import { Trans } from "@lingui/react/macro";
import {
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useParams } from "react-router-dom";
import {
  useConversationById,
  useConversationChunks,
  useProjectById,
} from "@/lib/query";
import { InformationTooltip } from "@/components/common/InformationTooltip";
import { ConversationEdit } from "@/components/conversation/ConversationEdit";
import { ConversationDangerZone } from "@/components/conversation/ConversationDangerZone";

export const ProjectConversationOverviewRoute = () => {
  const { conversationId, projectId } = useParams();
  const conversationQuery = useConversationById({
    conversationId: conversationId ?? "",
  });
  const conversationChunksQuery = useConversationChunks(conversationId ?? "");
  const projectQuery = useProjectById({ projectId: projectId ?? "" });

  return (
    <Stack gap="3rem" className="relative" px="2rem" pt="2rem" pb="2rem">
      <LoadingOverlay visible={conversationQuery.isLoading} />
      {conversationChunksQuery.data &&
        conversationChunksQuery.data?.length > 0 && (
          <Stack gap="1.5rem">
            {conversationQuery.data?.summary && (
              <>
                <Group>
                  <Title order={2}>
                    <Trans>Summary</Trans>
                  </Title>
                  <InformationTooltip
                    label={
                      <Text>
                        <Trans>
                          This summary is AI-generated and brief, for thorough
                          analysis, use the Chat or Library.
                        </Trans>
                      </Text>
                    }
                  />
                </Group>

                <Text>{conversationQuery.data?.summary}</Text>
                <Divider />
              </>
            )}
          </Stack>
        )}

      {conversationQuery.data && projectQuery.data && (
        <>
          <Stack gap="1.5rem">
            <ConversationEdit
              key={conversationQuery.data.id}
              conversation={conversationQuery.data}
              projectTags={projectQuery.data.tags}
            />
          </Stack>

          <Divider />

          <Stack gap="1.5rem">
            <ConversationDangerZone conversation={conversationQuery.data} />
          </Stack>
        </>
      )}
    </Stack>
  );
};
