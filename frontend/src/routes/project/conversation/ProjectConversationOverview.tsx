import { t, Trans } from "@lingui/macro";
import {
  Box,
  Button,
  Divider,
  Group,
  LoadingOverlay,
  Stack,
  TextInput,
  Textarea,
  Title,
  Text,
  Tooltip,
  ActionIcon,
  Anchor,
  Pill,
} from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import {
  useConversationById,
  useConversationChunks,
  useDeleteConversationByIdMutation,
  useUpdateConversationByIdMutation,
} from "@/lib/query";
import { apiCommonConfig } from "@/lib/api";
import { InformationTooltip } from "@/components/common/InformationTooltip";
import { usei18nNavigate } from "@/lib/usei18nNavigate";

const ConversationDangerZone = ({
  conversation,
}: {
  conversation: Conversation;
}) => {
  const deleteConversationByIdMutation = useDeleteConversationByIdMutation();
  const navigate = usei18nNavigate();
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

type ConversationEditFormValues = {
  title: string;
  description: string;
  context: string;
};

export const ProjectConversationOverviewRoute = () => {
  const { conversationId } = useParams();
  const conversationQuery = useConversationById({
    conversationId: conversationId ?? "",
  });
  const conversationChunksQuery = useConversationChunks(conversationId ?? "");

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

            <Group align="center">
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
            />
          </Stack>
        )}
      <Divider />

      <Box>
        <Text size="md">
          <Trans>Name</Trans>
        </Text>
        <Text size="sm">{conversationQuery.data?.participant_name}</Text>
      </Box>
      {conversationQuery.data?.participant_email && (
        <Box>
          <Text size="md">
            <Trans>Email</Trans>
          </Text>
          <Text size="sm">{conversationQuery.data?.participant_email}</Text>
        </Box>
      )}

      <Box>
        <Text size="md">
          <Trans>Created on</Trans>
        </Text>
        <Text size="sm">
          {new Date(conversationQuery.data?.created_at ?? 0).toLocaleString()}
        </Text>
      </Box>
      {conversationQuery.data?.tags &&
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
        )}
      <Divider />
      {conversationQuery.data && (
        <>
          {/* <ConversationEdit conversation={conversationQuery.data} />
          <Divider /> */}
          <ConversationDangerZone conversation={conversationQuery.data} />
        </>
      )}
    </Stack>
  );
};
