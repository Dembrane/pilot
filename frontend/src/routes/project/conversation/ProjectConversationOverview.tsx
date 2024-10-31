import { Trans, t } from "@lingui/macro";
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
    <Stack className="relative">
      <LoadingOverlay visible={conversationQuery.isLoading} />
      {conversationChunksQuery.data &&
        conversationChunksQuery.data?.length > 0 && (
          <Stack>
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

            {/* <Group align="center">
              <Title order={2}>
                <Trans>Audio Recording</Trans>
              </Title>
              <Tooltip label={t`Download audio`}>
                <a
                  href={
                    apiCommonConfig.baseURL +
                    "/conversations/" +
                    conversationId +
                    "/content"
                  }
                  download={
                    conversationQuery.data?.title ?? "Conversation" + ".webm"
                  }
                >
                  <ActionIcon size="md" variant="subtle" color="gray">
                    <IconDownload size={48} />
                  </ActionIcon>
                </a>
              </Tooltip>
            </Group>
            <audio
              className="w-full"
              src={
                apiCommonConfig.baseURL +
                "/conversations/" +
                conversationId +
                "/content"
              }
              controls
              crossOrigin="anonymous"
            /> */}
          </Stack>
        )}
      {/* <Divider /> */}

      {/* <Box>
        <Text size="md">
          <Trans>Name</Trans>
        </Text>
        <Text size="sm">{conversationQuery.data?.participant_name}</Text>
      </Box> */}

      {/* {conversationQuery.data?.participant_email && (
        <Box>
          <Text size="md">
            <Trans>Email</Trans>
          </Text>
          <Text size="sm">{conversationQuery.data?.participant_email}</Text>
        </Box>
      )} */}

      {/* {conversationQuery.data?.tags &&
        conversationQuery.data.tags.filter(
          (t) => !!(t.project_tag_id as ProjectTag)?.text,
        ).length > 0 && (
          <Box>
            <Text size="md">
              <Trans>Tags</Trans>
            </Text>
            <Group gap="sm" pr="sm">
              {conversationQuery.data?.tags &&
                conversationQuery.data?.tags.length > 0 &&
                conversationQuery.data?.tags.map((tag) =>
                  (tag.project_tag_id as ProjectTag)?.text ? (
                    <Pill key={tag.id} size="sm">
                      {(tag.project_tag_id as ProjectTag)?.text}
                    </Pill>
                  ) : null,
                )}
            </Group>
          </Box>
        )} */}

      {/* <Divider /> */}

      {conversationQuery.data && projectQuery.data && (
        <>
          <ConversationEdit
            key={conversationQuery.data.id}
            conversation={conversationQuery.data}
            projectTags={projectQuery.data.tags}
          />
          <Divider />
          <ConversationDangerZone conversation={conversationQuery.data} />
        </>
      )}
    </Stack>
  );
};
