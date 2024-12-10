import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Pill,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import {
  useConversationById,
  useConversationChunks,
  useDeleteConversationByIdMutation,
  useProjectById,
  useUpdateConversationByIdMutation,
} from "@/lib/query";
import { apiCommonConfig } from "@/lib/api";
import { InformationTooltip } from "@/components/common/InformationTooltip";
import { useI18nNavigate } from "@/lib/useI18nNavigate";
import { ConversationEdit } from "@/components/conversation/ConversationEdit";

const ConversationDangerZone = ({
  conversation,
}: {
  conversation: Conversation;
}) => {
  const deleteConversationByIdMutation = useDeleteConversationByIdMutation();
  const navigate = useI18nNavigate();
  const { projectId } = useParams();

  const handleDelete = () => {
    if (
      window.confirm(
        t`Are you sure you want to delete this conversation? This action cannot be undone.`,
      )
    ) {
      deleteConversationByIdMutation.mutate(conversation.id);
      navigate(`/projects/` + projectId + "/overview");
    }
  };

  return (
    <Stack>
      <Title order={2}>
        <Trans>Danger Zone</Trans>
      </Title>
      <Box>
        <Button
          onClick={handleDelete}
          color="red"
          variant="outline"
          rightSection={<IconTrash />}
        >
          <Trans>Delete Conversation</Trans>
        </Button>
      </Box>
    </Stack>
  );
};

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
